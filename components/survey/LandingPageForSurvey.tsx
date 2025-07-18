"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  Mail,
  DollarSign,
  Settings,
  AlarmClock,
  Users,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";


export default function SurveyLandingPage() {
  const router = useRouter();
  const session = useSession();

const handleStartSurvey = () => {
  if (session?.data?.user) {
    router.push("/survey/first-time-survey");
  } else {
    router.push("/signin");
  }
};


  const topics = [
    { icon: <Mail className="w-5 h-5" />, label: "Newsletters & Content Strategy" },
    { icon: <DollarSign className="w-5 h-5" />, label: "Pricing & Offers" },
    { icon: <Settings className="w-5 h-5" />, label: "Tools, Systems & Platforms" },
    { icon: <AlarmClock className="w-5 h-5" />, label: "Time Management & Burnout" },
    { icon: <Users className="w-5 h-5" />, label: "Niche Positioning & Ideal Clients" },
    { icon: <Brain className="w-5 h-5" />, label: "Mindset & Founder Beliefs" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Image */}
        <div className="w-full lg:w-1/2">
          <img
            src="/surveyImage.png"
            alt="Survey Graphic"
            className="rounded-lg w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
            What If 10,000 Solopreneurs Answered Every Business Question You’ve Ever Had?
          </h1>

          <p className="text-gray-700 text-base">
            You’re invited to co-create the world’s largest solopreneur intelligence database.
          </p>

          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-green-600">
              <Check className="w-5 h-5 mt-1" />
              <span>Answer questions you already ask yourself.</span>
            </li>
            <li className="flex items-start gap-2 text-green-600">
              <Check className="w-5 h-5 mt-1" />
              <span>Be part of something bigger.</span>
            </li>
            <li className="flex items-start gap-2 text-green-600">
              <Check className="w-5 h-5 mt-1" />
              <span>
                Help unlock a data vault that will change how solopreneurs make decisions.
              </span>
            </li>
          </ul>

          <Button
            onClick={handleStartSurvey}
            className="w-fit px-6 py-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold text-sm rounded-full shadow-sm"
          >
            Start Answering Now — (It’s free, takes 2 minutes to begin)
          </Button>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold">Why This Matters</h2>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>When to send newsletters that actually get opened</li>
                <li>What platforms are really converting (and for who)</li>
                <li>How pricing, offers, and niche positioning are actually working</li>
                <li>What habits, beliefs, and patterns high-performing solopreneurs share</li>
              </ul>
              <p className="text-sm text-gray-500 italic">
                But until then... the data stays locked.
              </p>
            </CardContent>
          </Card>

          <div className="text-gray-800 font-semibold text-sm mt-4">
            Insight Vault = Sealed until we reach 10,000 contributors.
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">What You Can Do Today</h3>
            {[
              "Start answering right now — even 1 question adds to the collective",
              "Answer what you want, skip what you don't",
              "Return anytime to continue (your answers are saved)",
              "Help us reach 10,000 faster — share with solopreneurs you trust",
            ]?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Checkbox id={`task-${idx}`} />
                <label htmlFor={`task-${idx}`} className="text-sm text-gray-700">
                  {item}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">
              Topics Covered (You Choose What to Answer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic, index) => (
                <Card key={index} className="p-4 flex items-center gap-3">
                  {topic.icon}
                  <span className="text-sm font-medium text-gray-800">{topic.label}</span>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="font-semibold">The Journey</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                You answer at your own pace
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Your data is anonymously added to the vault
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                When we reach 10,000 solopreneurs...
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                The Insight Vault opens for everyone who participated
              </li>
            </ul>
          </div>

          <div className="space-y-4 mt-8">
            <h3 className="font-semibold text-gray-800">Why Solopreneurs Are Joining:</h3>
            <blockquote className="text-sm italic text-gray-600">
              “I want to know what others like me are really doing.”
            </blockquote>
            <blockquote className="text-sm italic text-gray-600">
              “Finally — a space built for founders like us, not big corporations.”
            </blockquote>
            <blockquote className="text-sm italic text-gray-600">
              “I don’t need fluff. I need patterns, proof, and clarity.”
            </blockquote>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-gray-800">The Insight Vault is Sealed for Now</h3>
            <p className="text-sm text-gray-700">
              We’re not showing a single graph until we hit 10,000 contributors. Because this isn’t
              about shortcuts — it’s about truth, powered by numbers. The more solopreneurs
              contribute, the clearer the picture becomes.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-gray-800 text-lg">Ready to Add Your Voice?</h3>
            <p className="text-sm text-gray-700 mb-3">
              Start answering now. Be one of the first 10,000 solopreneurs to shape the future of
              how we work, sell, and thrive.
            </p>
            <Button
              onClick={handleStartSurvey}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              Start the Survey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-500 mt-6">
            <span className="font-semibold">Help Us Reach 10,000 Faster</span>
            <br />
            Share this survey with fellow solopreneurs and let’s unlock the data vault together!
          </div>
        </div>
      </div>
    </div>
  );
}
