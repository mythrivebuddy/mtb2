import { Metadata } from "next";
import SignInPageContent from "@/components/auth/SignInPageContent";

export const metadata: Metadata = {
  title: "Sign Up - MyThriveBuddy",
  description: "Create your MyThriveBuddy account",
};

export default function SignUpPage() {
   

  return (
    <SignInPageContent/>
  );
}
