"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SurveyCompleteComponent() {
  const [countdown, setCountdown] = useState(15);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  // Load the current question index once
  useEffect(() => {
    const savedIndex = localStorage.getItem("currentQuestionIndex");
    if (savedIndex !== null) {
      setCurrentIndex(Number(savedIndex));
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          setIsTimerRunning(false); // Unlock the button after 15s
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const handleNext = () => {
    if (currentIndex === null) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex >= 3) {
      localStorage.setItem("currentQuestionIndex", nextIndex.toString());
      router.push(`/survey/question-page/${nextIndex !==1 ? nextIndex-1 :nextIndex}`);
    } else {
      localStorage.removeItem("currentQuestionIndex");
      router.push(`/survey/thank-you-session-complete-page`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Thank you for answering.
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          The next question will appear in:
        </p>

        <div className="flex justify-center items-center mb-6">
          <span className="text-3xl font-bold text-gray-900">{countdown}s</span>
        </div>

        <button
          onClick={handleNext}
          disabled={isTimerRunning}
          className={`bg-blue-600 text-white px-6 py-2 rounded-lg text-lg ${
            isTimerRunning ? "cursor-not-allowed opacity-50" : "hover:bg-blue-700"
          }`}
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
