import { ActivityType, AuthMethod } from "@prisma/client";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { assignJp } from "@/lib/utils/jp";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const DEFAULT_MAX_AGE = 24 * 60 * 60;
const REMEMBER_ME_MAX_AGE = 7 * 24 * 60 * 60;

export const authConfig: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET_KEY!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials?.email,
            },
            include: {
              plan: true,
              blockedUsers: true,
            },
          });

          if (!user) throw new Error("No user found");
          if (user.authMethod !== "CREDENTIALS") {
            throw new Error("This account is registered using an external provider");
          }

          if (user.isBlocked) {
            let blockedMessage = "Your account is blocked.";
            if (user.blockedUsers?.length > 0) {
              const blockedInfo = user.blockedUsers[0];
              blockedMessage += ` Reason: ${blockedInfo.reason}. Blocked on: ${new Date(
                blockedInfo.blockedAt
              ).toLocaleString()}.`;
            }
            throw new Error(blockedMessage);
          }

          if (!user.isEmailVerified) {
            throw new Error("Your email is not verified. Please verify your email before signing in.");
          }

          if (!credentials?.password) throw new Error("Password is required");

          const isValid = await bcrypt.compare(credentials.password, user.password!);
          if (!isValid) throw new Error("Password is incorrect");

          assignJp(user, ActivityType.DAILY_LOGIN);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            rememberMe: credentials.rememberMe === "true",
            isFirstTimeSurvey: user.isFirstTimeSurvey ?? false,
            lastSurveyTime: user.lastSurveyTime ?? null,
          };
        } catch (error) {
          console.log("error", error);
          if (error instanceof Error) throw new Error(error.message);
          throw new Error("Something went wrong");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser && dbUser.authMethod === AuthMethod.CREDENTIALS) {
          return "/signin?error=account-exists-with-credentials";
        }

        const cookieStore = await cookies();
        const referralCode = cookieStore.get("referralCode")?.value;
        let referredById = null;

        if (!dbUser) {
          const role = user.email === process.env.ADMIN_EMAIL ? "ADMIN" : "USER";

          if (referralCode) {
            const referrer = await prisma.user.findUnique({ where: { referralCode } });
            if (referrer) referredById = referrer.id;
          }

          const createdUser = await prisma.user.create({
            data: {
              role,
              email: user.email!,
              name: user.name!,
              image: user.image || "",
              authMethod: AuthMethod.GOOGLE,
              isEmailVerified: true,
              isFirstTimeSurvey: true,
            },
            include: {
              plan: true,
            },
          });

          if (referredById) {
            await prisma.referral.create({
              data: {
                referrerId: referredById,
                referredId: createdUser.id,
              },
            });

            assignJp(createdUser, ActivityType.REFER_TO);

            const referrer = await prisma.user.findUnique({
              where: { id: referredById },
              include: { plan: true },
            });

            if (referrer) assignJp(referrer, ActivityType.REFER_BY);
            cookieStore.delete("referralCode");
          }

          assignJp(createdUser, ActivityType.SIGNUP);

          user.role = createdUser.role;
          user.id = createdUser.id;
          user.isFirstTimeSurvey = createdUser.isFirstTimeSurvey ?? true;
          user.lastSurveyTime = createdUser.lastSurveyTime ?? null;
        } else {
          const updatedUser = await prisma.user.update({
            where: { email: user.email! },
            data: {
              name: user.name!,
              image: user.image || "",
            },
            include: {
              plan: true,
            },
          });

          assignJp(updatedUser, ActivityType.DAILY_LOGIN);

          user.role = dbUser.role;
          user.id = dbUser.id;
          user.isFirstTimeSurvey = dbUser.isFirstTimeSurvey ?? false;
          user.lastSurveyTime = dbUser.lastSurveyTime ?? null;
        }

        return true;
      } catch (error) {
        console.error("Error saving user:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.rememberMe = user.rememberMe ?? false;
        token.maxAge = user.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
        token.isFirstTimeSurvey = user.isFirstTimeSurvey ?? false;
        token.lastSurveyTime = user.lastSurveyTime ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.rememberMe = token.rememberMe;
        session.user.isFirstTimeSurvey = token.isFirstTimeSurvey ?? false;
        session.user.lastSurveyTime = token.lastSurveyTime ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("Next-auth redirect callback:", { url, baseUrl });
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: DEFAULT_MAX_AGE,
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};