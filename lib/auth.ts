import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkIdentifierRateLimit } from "@/lib/rateLimit";
import {
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  requestMetaHeaders,
} from "@/lib/request-meta";
import { describeBrowser, describeDevice } from "@/lib/user-agent";
import { sendWelcomeEmail, sendAdminNewUserNotification } from "@/lib/mail";
import { isAllowedOrigin } from "@/lib/origins";

const isProduction = process.env.NODE_ENV === "production";

// Session cookie must be readable on sibling SpendWise origins (CORS data
// sharing), so in production it is SameSite=None; Secure. Origin checks
// (VULN-020) still guard mutations.
export const IS_AUTH_PRODUCTION = isProduction;

export const SESSION_COOKIE_NAME = isProduction
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    secure: isProduction,
    maxAge,
  };
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const email = credentials.email.toLowerCase().trim();
        const maxFailures = 10;
        const windowMs = 15 * 60 * 1000;

        // SECURITY FIX: SEC-08 — the old check used a module-level Map, which is
        // per-instance on serverless: a cold start or a second instance reset the
        // counter, so the 10-attempt cap was effectively unenforced. Throttling is
        // now shared via the Redis-backed limiter, keyed on the normalised email.
        const limited = await checkIdentifierRateLimit(
          email,
          "login",
          maxFailures,
          windowMs
        );
        if (limited) {
          throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Auto-signup. SEC-03: because this path also acts as registration, an
          // attacker can pre-register a victim's address with a password they
          // know. The takeover is neutralised in the OAuth signIn callback below,
          // which invalidates a password on an account the verified identity
          // provider claims.
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await (prisma.user.create as any)({
            data: {
              email,
              password: hashedPassword,
              authProvider: "credentials",
              onboarded: false,
            },
          });

          try {
            await sendWelcomeEmail(newUser.email, "New User");
          } catch (e) {
            console.error("Welcome email failed:", e);
          }

          sendAdminNewUserNotification(newUser.email, "", "credentials").catch((e) =>
            console.error("Admin new-user notification failed:", e)
          );

          return newUser;
        }

        // If user exists but was Google-only, we might want to block this or link it
        // For now, let's check if they have a password
        if (!(user as any).password) {
          throw new Error("This account uses Google sign-in. Please use Google to continue.");
        }

        if (user.isSuspended) {
          throw new Error("This account is suspended. Contact support for assistance.");
        }

        const isValid = await bcrypt.compare(credentials.password, (user as any).password);
        if (!isValid) {
          // The email is resolved above, so use it for a uniform failure path and
          // avoid revealing whether the account exists (user enumeration).
          throw new Error("Invalid email or password");
        }

        return user;
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: sessionCookieOptions(30 * 24 * 60 * 60),
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        // Same-origin, or any trusted SpendWise origin (cross-origin auth bridge)
        if (target.origin === baseUrl || isAllowedOrigin(target.origin)) return url;
      } catch {}
      return `${baseUrl}/onboarding`;
    },

    async signIn({ user, account }: { user: any; account: any }) {
      if (!user.email) {
        console.error("Sign-in failed: No email provided by auth provider.");
        return false;
      }

      try {
        // Auth event logged without PII for security compliance
        
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // SECURITY FIX: SEC-03 — the credentials flow doubles as sign-up, so an
        // attacker could pre-register a victim's address with a password they
        // know. Left alone, the victim's first Google sign-in would land them
        // inside the attacker's account. Google has just verified control of the
        // mailbox, so it outranks a password set through the other flow: clear
        // that password, which locks the attacker out and keeps the verified
        // owner in. Flagged for the admin audit trail.
        if (
          existingUser &&
          existingUser.authProvider === "credentials" &&
          existingUser.password
        ) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { password: null, authProvider: account?.provider || "google" },
          });

          await prisma.securityAlert
            .create({
              data: {
                type: "CREDENTIAL_OVERRIDE",
                severity: "WARNING",
                description:
                  "A verified OAuth sign-in cleared a password on a credentials account, which is the signature of an account pre-registration attempt.",
                userId: existingUser.id,
              },
            })
            .catch(() => {});

          console.warn(
            `[SECURITY] Cleared a credentials password for ${existingUser.email} on verified OAuth sign-in.`
          );
        }

        if (!existingUser) {
        console.log(`[Auth] New user account creation initiated.`);
                    // Create user and seed default categories
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              avatar: user.image || "",
              authProvider: account?.provider || "google",
              onboarded: false,
            },
          });

          // console.log(`User created (ID: ${newUser.id}). Sending welcome email...`);
          try {
            // Send welcome email
            await sendWelcomeEmail(newUser.email, newUser.name || "");
          } catch (emailError) {
            console.error("Warning: Failed to send welcome email:", emailError);
          }

          sendAdminNewUserNotification(newUser.email, newUser.name || "", account?.provider || "google").catch((e) =>
            console.error("Admin new-user notification failed:", e)
          );
        }

        // Log successful login
        const loggedUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (loggedUser) {
          // SECURITY FIX: SEC-10 — login history recorded hardcoded placeholder
          // values. Parse the real request headers so a compromised account can
          // actually be traced back to an origin. The next-auth `account`
          // object does not carry request metadata, so this reads the ambient
          // request headers when available and falls back to explicit unknowns.
          const reqHeaders = requestMetaHeaders();
          const userAgent = getUserAgentFromHeaders(reqHeaders);
          await (prisma as any).loginHistory.create({
            data: {
              userId: loggedUser.id,
              method: account?.provider || "google",
              status: "SUCCESS",
              ip: getClientIpFromHeaders(reqHeaders),
              device: describeDevice(userAgent),
              browser: describeBrowser(userAgent),
              userAgent,
            }
          }).catch((e: any) => console.error("Failed to log login history:", e));
        }

      } catch (error) {
        console.error("Prisma error during sign-in/upsert:", error);
        return false;
      }

      return true;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, name: true, onboarded: true, expenseMode: true, monthlyLimit: true, twoFactorEnabled: true, twoFactorVerifiedAt: true, isSuspended: true },
          });

          if (dbUser) {
            (session.user as any).id = dbUser.id;
            (session.user as any).name = dbUser.name;
            (session.user as any).onboarded = dbUser.onboarded;
            (session.user as any).expenseMode = dbUser.expenseMode;
            (session.user as any).monthlyLimit = dbUser.monthlyLimit;
            (session.user as any).twoFactorEnabled = (dbUser as any).twoFactorEnabled;
            (session.user as any).twoFactorVerifiedAt = dbUser.twoFactorVerifiedAt;
            (session.user as any).isSuspended = dbUser.isSuspended;
            (session.user as any).redirectTo = dbUser.onboarded ? "dashboard" : "onboarding";
          }
        } catch (error) {
          console.error("Error fetching session user from Prisma:", error);
        }
      }
      return session;
    },
  },
};