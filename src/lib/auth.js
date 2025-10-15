import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("No user found with this email");

        // ⚠️ Replace with bcrypt compare() if you hash passwords
        if (credentials.password !== user.password) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt", // use JWT session
    maxAge: 30 * 60, // ⏳ 30 minutes session expiry
    updateAge: 5 * 60, // refresh JWT every 5 minutes when active
  },

  callbacks: {
    async jwt({ token, user }) {
      // attach user data on first login
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      // make user data available in session
      session.user = token.user;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
