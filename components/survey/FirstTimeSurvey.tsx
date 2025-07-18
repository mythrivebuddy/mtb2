"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Welcome Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Welcome to SoloRise, Amelia!
      </h1>

      {/* Description */}
      <p className="text-gray-700 max-w-2xl mb-6">
        Join a data-powered tribe of solopreneurs! Complete our survey to tailor your experience,
        unlock personalized resources, and gain insights into what’s working for others like you.
      </p>

      {/* Progress Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-[75%]">
          <label className="text-sm font-medium text-gray-600 mb-1 block">
            Survey Completion
          </label>
          {/* Placeholder: Add Progress component here if needed */}
          <p className="text-xs text-gray-500 mt-1">
            500 of 10,000 solopreneurs have completed the survey
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, index) => (
          <Card
            key={index}
            className="flex flex-col bg-gray-50 shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <img
                src={topic.image}
                alt={topic.title}
                className="w-full h-full rounded-md object-cover"
              />
              <h3 className="text-base font-semibold text-gray-900">
                {topic.title}
              </h3>
              <p className="text-sm text-gray-600">{topic.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Button */}
      <div className="mt-11 flex justify-center items-center">
        <Button
          size="lg"
          className=" flex items-center justify-center px-6 rounded-full text-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/survey/question-page/1" >
            Start Survey
          </Link>
        </Button>
      </div>
    </div>
  );
}
