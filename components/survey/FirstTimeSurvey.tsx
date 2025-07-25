"use client";

import Image from "next/image";


import { useEffect, useState, useCallback } from "react"; // 👈 1. Import useCallback
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Topic {
  title: string;
  description: string;
  image: string;
}

const topics: Topic[] = [
  { title: "Newsletter Strategy", description: "Explore strategies to grow your newsletter.", image: "/First.png" },
  { title: "Pricing & Income", description: "Optimize your pricing and income streams.", image: "/second.png" },
  { title: "Tools & Tech", description: "Discover essential tools and technologies.", image: "/third.png" },
  { title: "Time Management", description: "Master your time management skills.", image: "/fourth.png" },
  { title: "Mindset & Motivation", description: "Cultivate a strong mindset for success.", image: "/fifth.png" },
  { title: "Lead Generation", description: "Generate leads effectively.", image: "/sixth.png" },
  { title: "Offers & Niching", description: "Refine your offers and niche.", image: "/7th.png" },
  { title: "Business Model", description: "Understand and optimize your business model.", image: "/bussinessmodal.jpeg" },
  { title: "Sales and Conversion", description: "Improve your sales and conversion rates.", image: "/sale.avif" },
];

interface ValidateErrorData {
  remainingMs?: number;
}

export default function FirstTimeSurvey() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user;
  console.log("users in ",user);
  
  const userId = user?.id;

  const [canStart, setCanStart] = useState(true);
  const [cooldownMessage, setCooldownMessage] = useState("");
  const [showCooldownModal, setShowCooldownModal] = useState(false);

  useEffect(() => {
    const checkCooldown = async () => {
      if (!userId) return;

      try {
        await axios.post("/api/survey/validate-survey-access", { userId });
        setCanStart(true);
      } catch (err) {
        const error = err as AxiosError<ValidateErrorData>;
        const remainingMs = error.response?.data?.remainingMs || 0;
        const minutesLeft = Math.ceil(remainingMs / 60000);
        const hours = Math.floor(minutesLeft / 60);
        const minutes = minutesLeft % 60;

        setCanStart(false);
        setCooldownMessage(`You can start again in ${hours}h ${minutes}m`);
      }
    };

    checkCooldown();
    // 👇 2. The dependency array should ONLY include values the effect actually uses.
  }, [userId]);

  const {data} =  useQuery({
    queryKey: ["survey-completion-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/survey/how-many-user-do-survey");
      return data;
    },
  })
  console.log(data);
  

  // 👇 3. Wrap the function in useCallback and list its own dependencies
  const handleStartSurvey = useCallback(async () => {

    console.log("hello check first time survey ");
    
    if (!userId) return;

    if (canStart) {
      try {
        
          const { data } = await axios.post("/api/survey/mark-is-first-survey", { userId });
          await update();
            // router.refresh();
          if (!data.success) {
            toast("Could not update survey status.");
            
            return;
          
        }
        router.push("/survey/question-page/1");
      } catch (err) {
        toast.error("An unexpected error occurred. Please try again.");
        console.error("Survey start error:", err);
      }
    } else {
      setShowCooldownModal(true);
    }
  }, [canStart, userId, user, router, update]); // Dependencies of handleStartSurvey

  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Welcome to SoloRise, {user?.name}
      </h1>

      <p className="text-gray-700 max-w-2xl mb-6">
        Join a data-powered tribe of solopreneurs! Complete our survey to tailor your experience,
        unlock personalized resources, and gain insights into what’s working for others like you.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full flex flex-col sm:w-[75%]">
          <label className="text-sm font-medium text-gray-600 mb-1 block">Survey Completion</label>
              <Button
          onClick={handleStartSurvey}
          className="flex w-fit items-center justify-center px-3 py-2 rounded-md text-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          {user?.isFirstTimeSurvey ? "Start survey" : "Continue where you left off"}
        </Button>
          <div>
          <p className="text-xs text-gray-500 mt-1">{data?.userCount} of 10,000 solopreneurs have completed the survey</p>
          </div>
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
                <Image
                  src={topic.image}
                  alt={topic.title}
                  width={192}
                  height={192}
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
    
      </div>

      {showCooldownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Session Cooldown
            </h3>
            <p className="mt-2 text-gray-600">
              To ensure thoughtful responses, we have a waiting period between survey sessions.
            </p>
            <p className="mt-4 text-lg font-medium text-blue-700">
              {cooldownMessage}
            </p>
            <Button
              onClick={() => setShowCooldownModal(false)}
              className="mt-6 w-full rounded-full bg-blue-600 hover:bg-blue-700"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}