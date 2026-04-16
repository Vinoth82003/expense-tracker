import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "Needs", isDefault: true },
  { name: "Rent", type: "Needs", isDefault: true },
  { name: "Transport", type: "Needs", isDefault: true },
  { name: "Utilities", type: "Needs", isDefault: true },
  { name: "Health", type: "Needs", isDefault: true },
  { name: "Education", type: "Needs", isDefault: true },
  { name: "Other", type: "Needs", isDefault: true },
  { name: "Entertainment", type: "Wants", isDefault: true },
  { name: "Shopping", type: "Wants", isDefault: true },
  { name: "Travel", type: "Wants", isDefault: true },
  { name: "Other", type: "Wants", isDefault: true },
];

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

          console.log(`User created (ID: ${newUser.id}). Seeding default categories...`);

          // Seed default categories for the new user
          try {
            await prisma.category.createMany({
              data: DEFAULT_CATEGORIES.map((cat) => ({
                ...cat,
                userId: newUser.id,
              })),
            });
            console.log("Default categories seeded successfully.");
          } catch (seedError) {
            console.error("Warning: Failed to seed default categories:", seedError);
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
            select: { id: true, onboarded: true, expenseMode: true, monthlyLimit: true },
          });

          if (dbUser) {
            (session.user as any).id = dbUser.id;
            (session.user as any).onboarded = dbUser.onboarded;
            (session.user as any).expenseMode = dbUser.expenseMode;
            (session.user as any).monthlyLimit = dbUser.monthlyLimit;
          }
        } catch (error) {
          console.error("Error fetching session user from Prisma:", error);
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


