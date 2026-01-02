/* eslint-disable react/no-unescaped-entities */
import { BookOpen, Lightbulb } from "lucide-react";

const DailyInsightCard = () => {
  return (
    <section className="bg-gradient-to-br from-slate-50 to-white dark:from-[#1a2630] dark:to-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative ">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 dark:text-white">
        <Lightbulb className="w-24 h-24" />
      </div>
      <div className="flex items-center gap-2 mb-4 text-[#F59E0B]">
        <Lightbulb className="w-5 h-5 fill-current" />
        <span className="text-sm font-bold uppercase tracking-wider">
          Insights
        </span>
      </div>
      <blockquote className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-4 flex-grow z-10">
        "Consistency beats intensity. Trust the compound effect."
      </blockquote>
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <BookOpen className="w-4 h-4" />
        <span>MyThriveBuddy Philosophy</span>
      </div>
    </section>
  );
};

export default DailyInsightCard;
