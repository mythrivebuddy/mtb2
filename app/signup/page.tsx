import { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";
import Navbar from "@/components/common/Navbar";
import Layout from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "Sign Up - MyThriveBuddy",
  description: "Create your MyThriveBuddy account",
};

export default function SignUpPage() {
  return (
    <Layout>
      {/* // <main className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] py-4 sm:py-6 md:py-8 px-4">
    //   <div className="max-w-[1280px] mx-auto">
    //     <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-4 sm:p-6 md:p-8">
    //       <Navbar /> */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E2875] mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Join MyThriveBuddy today</p>
        </div>
        <SignUpForm />
      </div>
      {/* //     </div>
    //   </div>
    // </main> */}
    </Layout>
  );
}
