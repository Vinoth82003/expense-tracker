import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/mail";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
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

          console.log(`User created (ID: ${newUser.id}). Sending welcome email...`);
          try {
            // Send welcome email
            await sendWelcomeEmail(newUser.email, newUser.name || "");
          } catch (emailError) {
            console.error("Warning: Failed to send welcome email:", emailError);
          }
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
            select: { id: true, name: true, onboarded: true, expenseMode: true, monthlyLimit: true, twoFactorEnabled: true },
          });

          if (dbUser) {
            (session.user as any).id = dbUser.id;
            (session.user as any).name = dbUser.name;
            (session.user as any).onboarded = dbUser.onboarded;
            (session.user as any).expenseMode = dbUser.expenseMode;
            (session.user as any).monthlyLimit = dbUser.monthlyLimit;
            (session.user as any).twoFactorEnabled = (dbUser as any).twoFactorEnabled;
          }
        } catch (error) {
          console.error("Error fetching session user from Prisma:", error);
        }
      }
      return session;
    },
  },
};
