import { PrismaClient } from "@prisma/client";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_MAX_AGE =  60* 60;
const REMEMBER_ME_MAX_AGE = 7 * 12 * 60 * 60;

export const authConfig: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }, // <-- Added Remember Me
      },
      async authorize(credentials) {
        try {
          // Find user in DB
          console.log("credentials", credentials);
          const user = await prisma.user.findUnique({
            where: {
              email: credentials?.email,
            },
          });
          if (!user) {
            throw new Error("No user found");
          }
          // Check password
          if (!credentials?.password) {
            throw new Error("Password is required");
          }
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password!
          );
          if (!isValid) {
            throw new Error("Password is incorrect");
          }

          // console.log("login done");
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: "USER",
            rememberMe: credentials.rememberMe === "true", // Convert checkbox value to boolean
          };
        } catch (error) {
          console.log("error", error);
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Something went wrong");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("signIn", user);

      try {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: user.email!,
          },
        });
        console.log("user exists info", dbUser);
        // throw new Error("User already exists"); // Throw error instead of returning a URL

        if (!dbUser) {
          // if user does not exist, create a new user and let signin
          const role = user.email === process.env.ADMIN_MAIL ? "ADMIN" : "USER";
          console.log(role);

          // ! Role should only be passes if user isVerified else not atlest for the ADMIN
          const createdUser = await prisma.user.create({
            data: {
              role: role,
              email: user.email!,
              name: user.name!,
              image: user.image ? user.image : "",
            },
          });
          console.log("user created info", createdUser);
          user.role = createdUser.role;
          user.id = createdUser.id;
        } else {
          // Use dbUser data for existing users
          user.role = dbUser.role;
          user.id = dbUser.id;
        }

        return true;
      } catch (error) {
        console.error("Error saving user:", error);
        // return `/login?error=Something went wrong`; // Redirect with error
        // throw new Error("Something went wrong"); // Throw a readable error
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // Now user.role exists because we added it in `signIn`
        token.id = user.id;
        token.rememberMe = user.rememberMe ?? false;
        console.log("remeberme tokencheck", token.rememberMe); //?dev

        token.maxAge =
          Math.floor(Date.now() / 1000) +
          (user.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE);
      }
      console.log("token", token); //?dev
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        console.log("token.role", token.role);
        session.user.role = token.role; // Attach role to session
        session.user.id = token.id;
        session.user.rememberMe = token.rememberMe;
        // session.maxAge =
        //   Math.floor(Date.now() / 1000) +
        //   (token.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE);
      }
      console.log("sessiondata", session); //?dev
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: DEFAULT_MAX_AGE, // Default 45 minutes
  },
  pages: {
    signIn: "/login", // Custom login page (optional)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
