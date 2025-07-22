"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SurveyCompleteComponent() {
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedIndex = localStorage.getItem("currentQuestionIndex");
    if (savedIndex !== null) {
      setCurrentIndex(Number(savedIndex));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimerRunning(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentIndex === null) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex >= 3) {
      localStorage.setItem("currentQuestionIndex", nextIndex.toString());
      router.push(
        `/survey/question-page/${nextIndex !== 1 ? nextIndex - 1 : nextIndex}`
      );
    } else {
      localStorage.removeItem("currentQuestionIndex");
      router.push(`/survey/thank-you-session-complete-page`);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Thank you for answering.
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          The next question button will enable in 15s:
        </p>

        {/* Realistic Analog Clock */}
        <div className="flex justify-center items-center mb-8">
          <div 
          className="relative w-52 h-52 rounded-full bg-gradient-to-br from-gray-200 to-white border-[10px] border-gray-400 shadow-xl"
          >
            {/* Hour Tick Marks Only */}
            

            {/* Static Hour Hand */}
            <div className="absolute w-1 h-[30%] bg-gray-800 origin-bottom left-1/2 top-[20%] z-10 transform -translate-x-1/2 rotate-[60deg]" />

            {/* Static Minute Hand */}
            <div className="absolute w-1 h-[40%] bg-gray-700 origin-bottom left-1/2 top-[10%] z-10 transform -translate-x-1/2 rotate-[180deg]" />

            {/* Animated Second Hand */}
            <div
              className="absolute w-[2px] h-[44%] bg-red-600 origin-bottom left-1/2 top-[6%] z-20"
              style={{
                transform: "translateX(-50%) rotate(0deg)",
                animation: "rotateHand 15s linear forwards",
              }}
            />

            {/* Center cap */}
            <div className="absolute w-4 h-4 bg-black rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 border-2 border-white" />
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={isTimerRunning}
          className={`bg-blue-600 text-white px-6 py-2 rounded-lg text-lg transition-all duration-300 ${
            isTimerRunning
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-blue-700"
          }`}
        >
          Next Question
        </button>
      </div>

      <style jsx>{`
        @keyframes rotateHand {
          from {
            transform: translateX(-50%) rotate(0deg);
          }
          to {
            transform: translateX(-50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
