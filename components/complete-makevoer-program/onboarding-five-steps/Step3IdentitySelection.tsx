"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  ArrowRight,
  Edit3,
  Quote,
  Lightbulb,
  Leaf,
} from "lucide-react";

interface Step3Props {
  selectedAreas: string[];
  areaGoals: Record<string, string>;
  identitiesByArea: Record<string, string[]>;
  areasMeta: {
    id: string;
    title: string;
    icon: React.ElementType;
  }[];
  onBack: () => void;
  onNext: (identities: Record<string, string>) => void;
}

const Step3IdentitySelection = ({
  selectedAreas = [],
  areaGoals = {},
  identitiesByArea = {},
  areasMeta = [],
  onBack,
  onNext,
}: Partial<Step3Props>) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [identities, setIdentities] = useState<Record<string, string>>({});
  const [customIdentity, setCustomIdentity] = useState("");

  const currentAreaId = selectedAreas[activeIndex];
  const currentGoal = areaGoals[currentAreaId];
  const options = identitiesByArea[currentAreaId] || [];

  const areaMeta = areasMeta.find((a) => a.id === currentAreaId);
  const AreaIcon = areaMeta?.icon;

  const handleSelect = (statement: string) => {
    setIdentities((prev) => ({ ...prev, [currentAreaId]: statement }));
    setCustomIdentity("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomIdentity(val);
    setIdentities((prev) => ({ ...prev, [currentAreaId]: val }));
  };

  const isLastArea = activeIndex === selectedAreas.length - 1;

  const handleNext = () => {
    if (isLastArea) {
      onNext?.(identities);
    } else {
      setActiveIndex((prev) => prev + 1);
      setCustomIdentity("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fc] font-['Inter'] text-[#0d101b]">
      <main className="mx-auto max-w-7xl px-4 lg:px-10 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Progress */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                  Step 3 of 5: Identity Selection
                </p>
                <span className="text-xs font-bold text-[#059669]">
                  60% Complete
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7e9f3]">
                <div
                  className="h-full bg-[#059669] transition-all duration-500 ease-out"
                  style={{ width: "60%" }}
                />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                Define Your 2026 Identity
              </h1>
              <p className="max-w-2xl text-base text-[#4c599a] lg:text-lg">
                Goals are what you want to achieve. Identity is who you become.
              </p>
            </div>

            {/* Card */}
            <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-[#e7e9f3] bg-white shadow-sm">
              {/* Nav arrows */}
              <div className="absolute top-1/2 left-2 z-10 hidden -translate-y-1/2 lg:flex">
                <button
                  onClick={() => setActiveIndex((p) => p - 1)}
                  disabled={activeIndex === 0}
                  className="flex size-10 items-center justify-center rounded-full border border-[#e7e9f3] bg-white shadow-md hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 lg:flex">
                <button
                  onClick={() => setActiveIndex((p) => p + 1)}
                  disabled={isLastArea}
                  className="flex size-10 items-center justify-center rounded-full border border-[#e7e9f3] bg-white shadow-md hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 border-b border-[#e7e9f3] bg-[#f8f9fc]/50 px-6 lg:px-10 py-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#dcfce7] text-[#059669]">
                  {AreaIcon && <AreaIcon size={24} />}
                </div>
                <div>
                  <span className="w-fit rounded bg-[#059669]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                    Area {activeIndex + 1} of {selectedAreas.length}
                  </span>
                  <h3 className="text-xl font-bold">
                    {areaMeta?.title}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-grow flex-col gap-8 p-6 overflow-y-auto lg:p-10">
                {/* Goal */}
                <div className="flex gap-4 rounded-xl border border-[#10b981]/20 bg-[#f0fdf4] p-5">
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <Flag className="text-[#059669]" size={20} />
                  </div>
                  <div>
                    <span className="mb-1 text-xs font-bold uppercase tracking-wide text-[#059669]">
                      Your Goal for Q1
                    </span>
                    <p className="text-base font-medium italic">
                      "{currentGoal}"
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3">
                  {options.map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all ${
                        identities[currentAreaId] === option
                          ? "border-[#059669] bg-[#059669]/5"
                          : "border-[#e7e9f3] bg-white hover:border-[#059669]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={identities[currentAreaId] === option}
                        onChange={() => handleSelect(option)}
                        className="size-5"
                      />
                      <p className="text-lg font-medium">{option}</p>
                    </label>
                  ))}
                </div>

                {/* Custom */}
                <div className="border-t border-[#e7e9f3] pt-4">
                  <input
                    value={customIdentity}
                    onChange={handleCustomChange}
                    placeholder="I am..."
                    className="w-full rounded-xl border px-5 py-4"
                  />
                  <Edit3 className="absolute right-10 top-[70%] text-gray-400" />
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 border-t p-4">
                {selectedAreas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-1.5 rounded-full ${
                      i === activeIndex
                        ? "w-8 bg-[#059669]"
                        : "w-2 bg-[#d1d5db]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-[#059669] px-8 py-3 text-white font-bold"
              >
                {isLastArea ? "Finish Step 3" : "Next Area"}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Right Sidebar (unchanged) */}
          <div className="hidden lg:col-span-4 lg:flex flex-col gap-6">
            <div className="rounded-xl border bg-white p-5">
              <Lightbulb className="text-[#059669]" size={24} />
              <p className="text-sm mt-2">
                Identity change is the foundation of lasting behavior change.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Step3IdentitySelection;
