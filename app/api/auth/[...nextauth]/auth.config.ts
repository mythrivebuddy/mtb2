import { ActivityType, AuthMethod, Role, Prisma } from "@prisma/client"; // <-- FIX: Added Role and Prisma
import { AuthOptions, DefaultSession } from "next-auth"; // <-- FIX: Added DefaultSession and User
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { assignJp } from "@/lib/utils/jp";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// 1. --- ADD THIS IMPORT ---
import jwt from "jsonwebtoken";


// --- FIX: ADDED MODULE AUGMENTATION BLOCK ---
declare module "next-auth" {
  /**
   * Extends the built-in Session type
   */
  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string;
      role: Role;
      rememberMe?: boolean; // <-- FIX: Made optional
      userType: string | null;
      membership: string | null;
      isFirstTimeSurvey: boolean;
      lastSurveyTime: string | null;
      authMethod: AuthMethod;
    } & DefaultSession["user"];
  }

  /**
   * Extends the built-in User type
   */
  interface User {
    role: Role;
    rememberMe?: boolean; // <-- FIX: Made optional
    isFirstTimeSurvey: boolean;
    userType: string | null;
    membership: string | null;
    lastSurveyTime: Date | null;
    authMethod: AuthMethod;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    role: Role;
    id: string;
    rememberMe?: boolean; // <-- FIX: Made optional
    isFirstTimeSurvey: boolean;
    userType: string | null;
    membership: string | null;
    lastSurveyTime: string | null;
    maxAge: number;
    supabaseAccessToken?: string;
     authMethod: AuthMethod;
  }
}
// --- END AUGMENTATION ---

// FIX: Define two separate types for the different 'includes'
type AuthUser = Prisma.UserGetPayload<{
  include: { plan: true; blockedUsers: true };
}>;

type UserWithPlan = Prisma.UserGetPayload<{
  include: { plan: true };
}>;


const DEFAULT_MAX_AGE = 24 * 60 * 60;
const REMEMBER_ME_MAX_AGE = 10 * 365 * 24 * 60 * 60;

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
          const user: AuthUser | null = await prisma.user.findUnique({ // <-- FIX: Use AuthUser type
            where: {
              email: credentials?.email,
            },
            include: {
              plan: true,
              blockedUsers: true, // <-- This is now included in the AuthUser type
            },
          });

          if (!user) throw new Error("No user found");
          if (user.authMethod !== "CREDENTIALS") {
            throw new Error("This account is registered using an external provider");
          }

          if (user.isBlocked) {
            let blockedMessage = "Your account is blocked.";

            // --- FIX ---
            // Check if the 'blockedUsers' object exists (is not null)
            if (user.blockedUsers) {
              // It's a single object, not an array, so access it directly.
              const blockedInfo = user.blockedUsers;
              blockedMessage += ` Reason: ${blockedInfo.reason}. Blocked on: ${new Date(
                blockedInfo.blockedAt
              ).toLocaleString()}.`;
            }
            // --- END FIX ---

            throw new Error(blockedMessage);
          }

          if (!user.isEmailVerified) {
            throw new Error("Your email is not verified. Please verify your email before signing in.");
          }

          if (!credentials?.password) throw new Error("Password is required");

          const isValid = await bcrypt.compare(credentials.password, user.password!);
          if (!isValid) throw new Error("Invalid credentials");

          assignJp(user, ActivityType.DAILY_LOGIN);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            rememberMe: ["true", "on", "1"].includes(String(credentials.rememberMe)),
            isFirstTimeSurvey: user.isFirstTimeSurvey ?? false,
            lastSurveyTime: user.lastSurveyTime ?? null,
            userType: user.userType ?? null,
            membership: user.membership ?? null,
            authMethod: user.authMethod
          };
        } catch (error) {
          if (error instanceof Error) throw new Error(error.message);
          throw new Error("Something went wrong");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // ... (This entire function stays exactly the same)
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

          const createdUser: UserWithPlan = await prisma.user.create({ // <-- FIX: Use UserWithPlan type
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

            const referrer: UserWithPlan | null = await prisma.user.findUnique({ // <-- FIX: Use UserWithPlan type
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
          const updatedUser: UserWithPlan = await prisma.user.update({ // <-- FIX: Use UserWithPlan type
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

    // 2. --- MODIFIED JWT CALLBACK ---
    async jwt({ token, user, trigger, session }) {
      // Your existing logic
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.rememberMe = user.rememberMe ?? false; // <-- FIX: Restored '?? false'
        token.maxAge = (user.rememberMe ?? false) ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE; // <-- FIX: Added '?? false'
        token.isFirstTimeSurvey = user.isFirstTimeSurvey;
        token.lastSurveyTime = user.lastSurveyTime ? user.lastSurveyTime.toISOString() : null;
        token.userType = user.userType ?? null;
        token.membership = user.membership ?? null;
        token.authMethod = user.authMethod
        // token.exp = Math.floor(Date.now() / 1000) + token.maxAge;
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            membership: true,
            userType: true,
            isFirstTimeSurvey: true,
            lastSurveyTime: true,
            authMethod: true
          }
        });
        // Overwrite token with fresh DB data
        if (dbUser) {
          token.membership = dbUser.membership || "FREE";
          token.userType = dbUser.userType;
          token.authMethod = dbUser.authMethod
          token.isFirstTimeSurvey = dbUser.isFirstTimeSurvey ?? token.isFirstTimeSurvey;
          token.lastSurveyTime = dbUser.lastSurveyTime?.toISOString() || token.lastSurveyTime;
        }
      }
      if (trigger === "update" && session) {
        // Custom fields sent from client
        if (session.userType !== undefined) {
          token.userType = session.userType;
        }
        if (session.membership !== undefined) {
          token.membership = session.membership;
        }
        if (session.isFirstTimeSurvey !== undefined) {
          token.isFirstTimeSurvey = session.isFirstTimeSurvey;
        }
        if (session.lastSurveyTime !== undefined) {
          token.lastSurveyTime = session.lastSurveyTime;
        }

        // Standard fields (name/picture)
        if (session.name !== undefined) token.name = session.name;
        if (session.picture !== undefined) token.picture = session.picture;
        if (session.authMethod !== undefined) token.authMethod = session.authMethod
      }

      // --- ADD THIS BLOCK TO SIGN THE SUPABASE TOKEN ---
      // This runs on sign-in AND on every token refresh
      if (process.env.SUPABASE_JWT_SECRET && token.id) {
        const payload = {
          sub: token.id as string, // This MUST be the user's Supabase UUID
          role: "authenticated",
          // Set expiry to be 1 hour
          exp: Math.floor(Date.now() / 1000) + (60 * 60),
        };
        token.supabaseAccessToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
      }
      // --- END NEW BLOCK ---

      return token;
    },

    // 3. --- MODIFIED SESSION CALLBACK ---
    async session({ session, token }) {
      // Your existing logic
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.rememberMe = token.rememberMe ?? false; // <-- FIX: Added '?? false'
        session.user.isFirstTimeSurvey = token.isFirstTimeSurvey;
        session.user.lastSurveyTime = token.lastSurveyTime;
        session.user.userType = token.userType;
        session.user.membership = token.membership;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.authMethod = token.authMethod
      }
      session.expires = new Date(Date.now() + token.maxAge * 1000).toISOString();

      // --- ADD THIS LINE TO PASS THE TOKEN TO THE CLIENT ---
      session.supabaseAccessToken = token.supabaseAccessToken; // <-- This is correct now
      // --- END NEW LINE ---
      // Persist login indefinitely for Remember Me users by updating cookie expiration
      // const cookieStore = await cookies();
      // const cookieName = process.env.NODE_ENV === "production"
      //   ? "__Secure-next-auth.session-token"
      //   : "next-auth.session-token";

      // const existing = cookieStore.get(cookieName);

      // if (existing) {
      //   cookieStore.set(cookieName, existing.value, {
      //     httpOnly: true,
      //     secure: process.env.NODE_ENV === "production",
      //     sameSite: "lax",
      //     path: "/",
      //     expires: new Date(Date.now() + token.maxAge * 1000),
      //   });
      // }
      return session;
    },

    async redirect({ url, baseUrl }) {
      
      // you only redirect to it if it is on the same host (optional security check)
      if (url.startsWith(baseUrl)) return url;

      // If the URL is relative (e.g., '/dashboard/membership'), prepend the base URL
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Fallback to a default if a valid URL isn't present
      return baseUrl;
    },
  },
  session: {
    // ... (Your existing session config stays the same)
    strategy: "jwt",
    // maxAge: DEFAULT_MAX_AGE,
  },
  pages: {
    // ... (Your existing pages config stays the same)
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};