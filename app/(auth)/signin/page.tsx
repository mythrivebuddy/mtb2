 
import SignInPageContent from "@/components/auth/SignInPageContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In - MyThriveBuddy",
  description: "Sign in to your MyThriveBuddy account",
};

export default function SignInPage() {
  return (
  <Suspense fallback={<div>Loading...</div>}>

    <SignInPageContent />;
  </Suspense>)
}
