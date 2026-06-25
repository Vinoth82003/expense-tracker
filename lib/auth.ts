import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/mail";

const failedLogins = new Map<string, { count: number; first: number }>();

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

        const email = credentials.email.toLowerCase();
        const now = Date.now();
        const windowMs = 15 * 60 * 1000;
        const maxFailures = 10;

        const record = failedLogins.get(email) ?? { count: 0, first: now };
        if (now - record.first > windowMs) {
          record.count = 0;
          record.first = now;
        }

        if (record.count >= maxFailures) {
          throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Auto-signup logic: If user doesn't exist, create them
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await (prisma.user.create as any)({
            data: {
              email: credentials.email,
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

          failedLogins.delete(email);
          return newUser;
        }

        // If user exists but was Google-only, we might want to block this or link it
        // For now, let's check if they have a password
        if (!(user as any).password) {
          record.count++;
          failedLogins.set(email, record);
          throw new Error("This account uses Google sign-in. Please use Google to continue.");
        }

        const isValid = await bcrypt.compare(credentials.password, (user as any).password);
        if (!isValid) {
          record.count++;
          failedLogins.set(email, record);
          throw new Error("Invalid password");
        }

        failedLogins.delete(email);
        return user;
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (!user.email) {
        console.error("Sign-in failed: No email provided by auth provider.");
        return false;
      }

      try {
        console.log(`Authenticating user: ${user.email}`);
        
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          console.log(`New user detected. Creating account for: ${user.email}`);
          
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
        }

        // Log successful login
        const loggedUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (loggedUser) {
          await (prisma as any).loginHistory.create({
            data: {
              userId: loggedUser.id,
              method: account?.provider || "google",
              status: "SUCCESS",
              ip: "0.0.0.0", 
              device: "Unknown",
              browser: "Unknown",
              userAgent: "",
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
            select: { id: true, name: true, onboarded: true, expenseMode: true, monthlyLimit: true, twoFactorEnabled: true, isSuspended: true },
          });

          if (dbUser) {
            (session.user as any).id = dbUser.id;
            (session.user as any).name = dbUser.name;
            (session.user as any).onboarded = dbUser.onboarded;
            (session.user as any).expenseMode = dbUser.expenseMode;
            (session.user as any).monthlyLimit = dbUser.monthlyLimit;
            (session.user as any).twoFactorEnabled = (dbUser as any).twoFactorEnabled;
            (session.user as any).isSuspended = dbUser.isSuspended;
          }
        } catch (error) {
          console.error("Error fetching session user from Prisma:", error);
        }
      }
      return session;
    },
  },
};