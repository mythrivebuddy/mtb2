import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      role: string;
      id: string;
      rememberMe: boolean;
      isFirstTimeSurvey: boolean;
      lastSurveyTime: Date | null;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: string;
    rememberMe: boolean;
    isFirstTimeSurvey: boolean;
    lastSurveyTime: Date | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id: string;
    role: string;
    rememberMe: boolean;
    isFirstTimeSurvey: boolean;
     lastSurveyTime: Date | null;
  }
}
