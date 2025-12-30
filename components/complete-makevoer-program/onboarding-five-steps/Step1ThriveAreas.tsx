"use client";

import React, { useState, useEffect } from "react";
import {
  Info,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
} from "lucide-react";

interface StepOneProps {
  areas: {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  selectedIds: string[];
  onUpdate: (ids: string[]) => void;
  onNext: () => void;
}

const Step1ThriveAreas = ({
  selectedIds,
  onUpdate,
  onNext,
  areas,
}: StepOneProps) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleSelection = (id: string) => {
    const isAlreadySelected = selectedIds.includes(id);

    if (isAlreadySelected) {
      onUpdate(selectedIds.filter((i) => i !== id));
      return;
    }

    if (selectedIds.length >= 3) {
      setShowToast(true);
      return;
    }

    onUpdate([...selectedIds, id]);
  };

  const isComplete = selectedIds.length === 3;

  return (
    <main className="flex-1 flex justify-center py-6 px-4 sm:px-8 font-display relative">
      {/* Toast Notification */}
      <div
        className={`fixed top-20 right-4 z-[100] transition-all duration-300 transform ${showToast ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0 pointer-events-none"}`}
      >
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600" />
          <p className="font-medium text-sm">
            You can only select up to 3 areas.
          </p>
          <button
            onClick={() => setShowToast(false)}
            className="hover:bg-amber-100 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1024px] flex flex-col gap-8">
        {/* Progress Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">
              Step 1 of 5
            </p>
            <p className="text-emerald-600 text-sm font-bold">20% Completed</p>
          </div>
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: "25%" }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="text-[#0d101b] dark:text-white text-3xl sm:text-4xl font-black">
            Where do you want to{" "}
            <span className="text-emerald-500">thrive</span> in 2026?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Select the top{" "}
            <span className="font-bold text-[#0d101b] dark:text-white">
              3 areas
            </span>{" "}
            you want to prioritize.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {areas.map((area) => {
            const isSelected = selectedIds.includes(area.id);
            const limitReached = selectedIds.length >= 3;
            const Icon = area.icon;

            return (
              <button
                key={area.id}
                onClick={() => toggleSelection(area.id)}
                className={`group relative flex flex-col gap-4 rounded-xl border-2 p-6 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 scale-[1.02]"
                    : "border-transparent bg-white dark:bg-gray-800 hover:border-emerald-500/30"
                } ${limitReached && !isSelected ? "opacity-60 grayscale-[0.5]" : "opacity-100"}`}
              >
                <div className="flex justify-between items-start">
                  <div
                    className={`rounded-full p-3 ${isSelected ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"}`}
                  >
                    <Icon size={28} strokeWidth={isSelected ? 2.5 : 2} />
                  </div>
                  <div
                    className={`transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    {isSelected ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <Circle size={24} className="text-gray-300" />
                    )}
                  </div>
                </div>
                <div>
                  <h3
                    className={`font-bold ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-[#0d101b] dark:text-white"}`}
                  >
                    {area.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {area.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-xl px-6 py-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-emerald-500" />
            <p className="text-sm dark:text-gray-300">
              <span className="font-bold text-emerald-500">
                {selectedIds.length} of 3
              </span>{" "}
              areas selected
            </p>
          </div>
          <button
            disabled={!isComplete}
            onClick={onNext}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-bold transition-all ${
              isComplete
                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            }`}
          >
            <span>Next Step</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default Step1ThriveAreas;
