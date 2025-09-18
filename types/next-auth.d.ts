import { UserRole } from "@prisma/client"; // Or import your Role enum if it's defined elsewhere
import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { type JWT } from "next-auth/jwt";

// Extend the built-in session and user types
declare module "next-auth" {
  /**
   * The shape of the user object returned in the providers' `authorize` callback.
   * Also available in the `jwt` callback's `user` parameter.
   */
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    rememberMe?: boolean;
    isFirstTimeSurvey: boolean;
    lastSurveyTime: Date | null;
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      rememberMe?: boolean;
      isFirstTimeSurvey: boolean;
      lastSurveyTime: string | null; // Dates are serialized to strings in the session
    } & DefaultSession["user"]; // Keep the default properties like name, email, image
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    role: UserRole;
    rememberMe?: boolean;
    isFirstTimeSurvey: boolean;
    lastSurveyTime: string | null; // Dates are serialized to strings in the JWT
  }
}