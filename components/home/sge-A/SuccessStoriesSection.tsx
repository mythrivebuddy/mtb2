/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import { MtbSparklesIcon } from "@/icons/mtb-icons";
import { SectionHeading } from "./SectionHeading";

const testimonials = [
  {
    name: "Aman Verma",
    role: "Software Engineer",
    quote:
      "MTB helped me stop restarting my routines every few weeks. For the first time, consistency feels calm instead of exhausting.",
  },
  {
    name: "Riya Sharma",
    role: "Student",
    quote:
      "The accountability and structure made a bigger difference than motivation ever did. I finally feel like I'm moving forward.",
  },
  {
    name: "Priya Nair",
    role: "Founder",
    quote:
      "I finally stopped consuming and started doing. MTB gave me the structure I didn't know I needed.",
  },
  {
    name: "Rohan Mehta",
    role: "Designer",
    quote:
      "The community kept me going on the days I wanted to quit. That alone was worth it.",
  },
];

export const SuccessStoriesSection = () => {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <section className="py-14 sm:py-24 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto">
      {/* Heading */}
      <SectionHeading
        eyebrow="Stories From Inside"
        title="Real people."
        highlight="Real momentum."
        subtitle="Growth looks different for everyone — but consistency changes everything."
      />

      {/* ── DESKTOP: grid of 2 with side arrows ── */}
      <div className="hidden md:flex items-center justify-center gap-6 mb-12">
        <button
          onClick={prev}
          className="w-12 h-12 shrink-0 rounded-full border border-[#D6C5B3] bg-white flex items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-1" />
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {[testimonials[current], testimonials[(current + 1) % testimonials.length]].map(
            (testimonial, i) => (
              <TestimonialCard key={i} testimonial={testimonial} imgIndex={i} />
            )
          )}
        </div>

        <button
          onClick={next}
          className="w-12 h-12 shrink-0 rounded-full border border-[#D6C5B3] bg-white flex items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors"
        >
          <ChevronRight className="w-6 h-6 stroke-1" />
        </button>
      </div>

      {/* ── MOBILE: single card carousel with arrows + dots ── */}
    {/* ── MOBILE: single card carousel with arrows + dots ── */}
<div className="md:hidden mb-12">

  {/* Card with overlapping arrows */}
  <div className="relative w-full">
    
    {/* Left Arrow — overlaps card */}
    <button
      onClick={prev}
      className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 shrink-0 rounded-full border border-[#D6C5B3] bg-white flex items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors shadow-sm"
    >
      <ChevronLeft className="w-5 h-5 stroke-1" />
    </button>

    {/* Card */}
    <TestimonialCard testimonial={testimonials[current]} imgIndex={current} />

    {/* Right Arrow — overlaps card */}
    <button
      onClick={next}
      className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 shrink-0 rounded-full border border-[#D6C5B3] bg-white flex items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors shadow-sm"
    >
      <ChevronRight className="w-5 h-5 stroke-1" />
    </button>
  </div>

  {/* Dot indicators */}
  <div className="flex items-center justify-center gap-2 mt-6">
    {testimonials.map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrent(i)}
        className={`rounded-full transition-all duration-300 ${
          i === current
            ? "w-3 h-3 bg-[#B87042]"
            : "w-3 h-3 bg-transparent border border-[#B87042]"
        }`}
      />
    ))}
  </div>
</div>

      {/* Bottom Card */}
      <div className="bg-white border border-[#B87042] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-[1200px] mx-auto px-8">
        <div className="flex items-center gap-6">
          <div className="w-6 h-6 sm:w-14 sm:h-14 bg-[#FCF9F3] rounded-full flex items-center justify-center text-[#B87042]">
            <MtbSparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm sm:text-xl text-[#2C251F]">
              Different paths. Same destination.
            </p>
            <p className=" text-sm sm:text-xl text-[#B87042] ">
              Let's grow, together.
            </p>
          </div>
        </div>
        <button
          className={`hidden md:flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${theme.buttonDark}`}
        >
          Start Your Journey <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

// ── Extracted card so both views share the same markup ──
const TestimonialCard = ({
  testimonial,
  imgIndex,
}: {
  testimonial: { name: string; role: string; quote: string };
  imgIndex: number;
}) => (
  <div className="bg-white border border-[#B87042] rounded-3xl w-full p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
    <div className="w-32 h-40 shrink-0 bg-stone-200 rounded-xl overflow-hidden">
      <img
        src={`https://i.pravatar.cc/300?img=${imgIndex + 11}`}
        alt={testimonial.name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex flex-col justify-between h-full py-2">
      <p className="font-serif text-lg text-[#2C251F] leading-snug mb-6">
        "{testimonial.quote}"
      </p>
      <div>
        <h5 className="font-semibold text-sm text-[#2C251F]">{testimonial.name}</h5>
        <p className="text-xs text-[#5A5048]">{testimonial.role}</p>
      </div>
    </div>
  </div>
);