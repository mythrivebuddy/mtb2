import { Metadata } from "next";
import SiginUpPageContent from "@/components/auth/SiginUpPageContent";

export const metadata: Metadata = {
  title: "Sign Up - MyThriveBuddy",
  description: "Create your MyThriveBuddy account",
};

export default function SignUpPage() {
  return <SiginUpPageContent />;
}
