"use client";

import React, { useState } from "react";
import { CategoryManager } from "./CategoryManager";
import { QuestionManager } from "./QuestionManager";
import { ImportManager } from "./ImportManager";
import { CategoryWithQuestions, QuestionWithCategory } from "@/types/types";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(res => res.json());
import { cn } from "@/lib/utils/tw";

type Tab = "categories" | "questions" | "import";

export function SurveyTabs({ categories, questions }: { categories: CategoryWithQuestions[], questions: QuestionWithCategory[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
 
  // Use SWR to fetch questions for instant UI update
  const { data: swrQuestions, mutate } = useSWR("/api/survey/question/list", fetcher, {
    fallbackData: questions
  });

  const renderContent = () => {
    switch (activeTab) {
      case "questions":
        return <QuestionManager questions={swrQuestions || []} categories={categories} mutateQuestions={mutate} />;
      case "import":
        return <ImportManager />;
      case "categories":
      default:
        return <CategoryManager categories={categories} />;
    }
  };

  const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md",
        activeTab === tab 
          ? "bg-blue-600 text-white" 
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex space-x-2 border-b pb-4 mb-6">
        <TabButton tab="categories" label="Manage Categories" />
        <TabButton tab="questions" label="Manage Questions" />
        <TabButton tab="import" label="Import from Excel" />
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
