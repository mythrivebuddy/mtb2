import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!existingUser || !existingUser.password) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          existingUser.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Return the full user object with our custom fields
        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          rememberMe: !!credentials.rememberMe,
          isFirstTimeSurvey: existingUser.isFirstTimeSurvey ?? false,
          userType: existingUser.userType,    
          membership: existingUser.membership,
          lastSurveyTime: existingUser.lastSurveyTime,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // The user object is only passed on the first sign-in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.rememberMe = user.rememberMe;
         token.userType = user.userType; 
         token.membership = user.membership;
        token.isFirstTimeSurvey = user.isFirstTimeSurvey;
        token.lastSurveyTime = user.lastSurveyTime?.toISOString() || null;
      }
      const dbUser = await prisma.user.findUnique({
      where: { id: token.id },
      select: { membership: true,userType:true }
    });

    token.membership = dbUser?.membership || "FREE";
    token.userType = dbUser?.userType || null;
      return token;
    },
    async session({ session, token }) {
      // Pass the custom properties from the token to the session
      if (session.user && token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.userType = token.userType; 
        session.user.membership = token.membership;
        session.user.rememberMe = token.rememberMe;
        session.user.isFirstTimeSurvey = token.isFirstTimeSurvey;
        session.user.lastSurveyTime = token.lastSurveyTime;
      }

      // Debug log (remove in production)
      // console.log("Session user:", session.user);

      return session;
    },
  },
};