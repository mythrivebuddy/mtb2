"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const topics = [
  {
    title: "Newsletter Strategy",
    description: "Explore strategies to grow your newsletter.",
    image: "/First.png",
  },
  {
    title: "Pricing & Income",
    description: "Optimize your pricing and income streams.",
    image: "/second.png",
  },
  {
    title: "Tools & Tech",
    description: "Discover essential tools and technologies.",
    image: "/third.png",
  },
  {
    title: "Time Management",
    description: "Master your time management skills.",
    image: "/fourth.png",
  },
  {
    title: "Mindset & Motivation",
    description: "Cultivate a strong mindset for success.",
    image: "/fifth.png",
  },
  {
    title: "Lead Generation",
    description: "Generate leads effectively.",
    image: "/sixth.png",
  },
  {
    title: "Offers & Niching",
    description: "Refine your offers and niche.",
    image: "/7th.png",
  },
  {
    title: "Business Model",
    description: "Understand and optimize your business model.",
    image: "/bussinessmodal.jpeg",
  },
  {
    title: "Sales and Conversion",
    description: "Improve your sales and conversion rates.",
    image: "/sale.avif",
  },
];

export default function FirstTimeSurvey() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const user = session?.user;
  const userId = user?.id;
  console.log("user",user);
  
  const handleStartSurvey = async () => {
    if (!userId) return;

    try {
      const now = Date.now();
      const lastSurveyTime = user?.lastSurveyTime ? new Date(user.lastSurveyTime).getTime() : 0;
      const cooldownMs = 4 * 60 * 60 * 1000;

      if (now - lastSurveyTime < cooldownMs) {
        const remaining = cooldownMs - (now - lastSurveyTime);
        const minutesLeft = Math.ceil(remaining / 60000);
        const hours = Math.floor(minutesLeft / 60);
        const minutes = minutesLeft % 60;

        toast(
          `You can start a new survey in ${hours} hour${hours !== 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`
        );
        return;
      }

      if (user?.isFirstTimeSurvey === true) {
        const { data } = await axios.post("/api/survey/mark-is-first-survey", {
          userId,
        });

        if (!data.success) {
          toast("Could not mark first-time survey status.");
          return;
        }
      }

      const { data: updateData } = await axios.post("/api/survey/update-last-survey-time", {
        userId,
      });

      if (!updateData.success) {
        toast("There was a problem starting the survey. Please try again.");
        return;
      }

      // 🔄 Refresh session so latest data reflects in session.user
      await update();

      router.push("/survey/question-page/1");
    } catch (error) {
      console.error("Survey start error:", error);
      toast("Unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Welcome to SoloRise, {user?.name}
      </h1>

      <p className="text-gray-700 max-w-2xl mb-6">
        Join a data-powered tribe of solopreneurs! Complete our survey to tailor
        your experience, unlock personalized resources, and gain insights into
        what’s working for others like you.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-[75%]">
          <label className="text-sm font-medium text-gray-600 mb-1 block">
            Survey Completion
          </label>
          <p className="text-xs text-gray-500 mt-1">
            500 of 10,000 solopreneurs have completed the survey
          </p>
        </div>
      </div>

      <div className="inline-block mb-6 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
        Showing dummy data
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, index) => (
          <Card key={index} className="flex flex-col bg-gray-50 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="w-full h-48">
                <img
                  src={topic.image}
                  alt={topic.title}
                  className="w-full h-full rounded-md object-cover"
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{topic.title}</h3>
              <p className="text-sm text-gray-600">{topic.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-11 flex justify-center items-center">
        <Button
          onClick={handleStartSurvey}
          size="lg"
          className="flex items-center justify-center px-6 rounded-full text-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          {user?.isFirstTimeSurvey ? "Start survey" : "Continue where you left off"}
        </Button>
      </div>
    </div>
  );
}
