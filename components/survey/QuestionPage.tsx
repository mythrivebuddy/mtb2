"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // if using query param
// OR use `params` from route file if using dynamic route like /question-page/[questionId]

const questions = [
  {
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
    question: "What tools are you currently using to manage your business?",
    options: [
      "CRM software",
      "Email marketing tools",
      "Accounting software",
      "Project management tools",
      "None",
    ],
  },

    {
    question: "What hidimba challenges are you facing with your current marketing strategy?",
    options: [
      "Lack of budget",
      "Limited reach",
      "Inconsistent messaging",
      "Low engagement",
      "Other",
    ],
  },
  {
    question: "What hidimba challenges are you facing with your current marketing strategy?",
    options: [
      "Lack of budget",
      "Limited reach",
      "Inconsistent messaging",
      "Low engagement",
      "Other",
    ],
  },
  {
    question: "What hidimba challenges are you facing with your current marketing strategy?",
    options: [
      "Lack of budget",
      "Limited reach",
      "Inconsistent messaging",
      "Low engagement",
      "Other",
    ],
  }
];



export default function QuestionPageComponent({ questionId }: { questionId: string }) {
  const router = useRouter();
  const index = parseInt(questionId);

  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    if (!isNaN(index)) {
      localStorage.setItem("currentQuestionIndex", index.toString());
    }
  }, [index]);

  const handleNextQuestion = () => {
    const nextIndex = index + 1;

    if (nextIndex < questions.length) {
      localStorage.setItem("currentQuestionIndex", nextIndex.toString());
      router.push(`/survey/thank-you-timer-page`);
    } else {
      localStorage.removeItem("currentQuestionIndex");
      router.push(`/survey/thank-you-session-complete-page`);
    }
  };

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
  };

  const currentQuestion = questions[index];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold">
        Invalid question
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentQuestion.question}
        </h2>

        <div className="space-y-4">
          {currentQuestion?.options?.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                id={`option-${index}`}
                name="question-options"
                value={option}
                checked={selectedOption === option}
                onChange={() => handleOptionChange(option)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor={`option-${index}`} className="ml-2 text-gray-700 text-lg">
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNextQuestion}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg"
          disabled={!selectedOption}
        >
          Next
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          Every answer helps us (and you) get clearer! You can answer 3 questions per login with a
          4-hour gap between sessions. There’s a 15-second pause between each question.
        </p>
      </div>
    </div>
  );
}
