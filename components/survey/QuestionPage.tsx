"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { useSession } from "next-auth/react"; // 👈 1. Import useSession
import axios from "axios"; // 👈 2. Import axios
import { toast } from "sonner"; // 👈 3. Import toast for user feedback

const questions = [
  {
    category: "Goals & Planning",
    question: "What are your primary business goals for the next quarter?",
    options: [
      "Increase customer acquisition",
      "Improve customer retention",
      "Expand into new markets",
      "Launch a new product or service",
      "Increase revenue",
      "Reduce operational costs",
    ],
  },
  {
    category: "Marketing Challenges",
    question: "What challenges are you facing with your current marketing strategy?",
    options: [
      "Lack of budget",
      "Limited reach",
      "Inconsistent messaging",
      "Low engagement",
      "Other",
    ],
  },
  {
    category: "Tools & Platforms",
    question: "What tools are you currently using to manage your business?",
    options: [
      "CRM software",
      "Email marketing tools",
      "Accounting software",
      "Project management tools",
      "None",
    ],
  },
];

const darkGradients = [
  "bg-gradient-to-r from-gray-800 via-indigo-900 to-gray-900",
  "bg-gradient-to-r from-purple-900 via-violet-700 to-blue-900",
  "bg-gradient-to-r from-slate-800 via-zinc-700 to-neutral-900",
];

export default function QuestionPageComponent({ questionId }: { questionId: string }) {
  const router = useRouter();
  const { data: session } = useSession(); // 👈 4. Get session data to access the user
  const index = parseInt(questionId);
  const [selectedOption, setSelectedOption] = useState("");
  const [showDialog, setShowDialog] = useState(true);

  useEffect(() => {
    if (!isNaN(index)) {
      localStorage.setItem("currentQuestionIndex", index.toString());
    }
  }, [index]);

  // 👇 5. Make the function async to handle the API call
  const handleNextQuestion = async () => {
    const userId = session?.user?.id;
    const nextIndex = index + 1;

    if (nextIndex <= questions.length) {
      // This logic correctly handles moving between questions
      localStorage.setItem("currentQuestionIndex", nextIndex.toString());
      router.push(`/survey/thank-you-timer-page`);
    } else {
      // ✅ This block now handles the final question submission and API call
      if (!userId) {
        toast.error("You must be logged in to complete the survey.");
        return;
      }
      try {
        // 🚀 Call the API to update the timestamp and start the cooldown
        await axios.post("/api/survey/update-last-survey-time", { userId });

        // On success, proceed to the completion page
        localStorage.removeItem("currentQuestionIndex");
        router.push(`/survey/thank-you-session-complete-page`);
      } catch (error) {
        toast.error("Could not complete the session. Please try again.");
        console.error("Failed to update survey time:", error);
      }
    }
  };

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
  };

  const currentQuestion = questions[index - 1];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold">
        Invalid question
      </div>
    );
  }

  const gradientClass = darkGradients[(index - 1) % darkGradients.length];

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Blurred background */}
      <div
        className={`transition-opacity duration-300 ${
          showDialog ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"
        } px-6 py-12 max-w-3xl mx-auto`}
      >
        <div className="text-center text-gray-400">Loading...</div>
      </div>

      {/* Modal Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 px-3 sm:px-4 md:px-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl px-6 py-8">
            {/* 🎨 Category Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium text-white shadow-sm mb-4 ${gradientClass}`}
            >
              <Tag size={16} />
              <span>Category: {currentQuestion.category}</span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${idx}`}
                    name="question-options"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => handleOptionChange(option)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor={`option-${idx}`} className="ml-2 text-gray-700 text-lg">
                    {option}
                  </label>
                </div>
              ))}
            </div>

            {/* Next Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDialog(false);
                  handleNextQuestion();
                }}
                className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg text-lg disabled:opacity-50"
                disabled={!selectedOption}
              >
                Next
              </button>
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-sm text-gray-500">
              <p>
                Every answer helps us (and you) get clearer! You can answer 3 questions per login with a
                4-hour gap between sessions. There’s a 15-second pause between each question.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}