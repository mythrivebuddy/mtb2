"use client";

import React, { useState } from 'react';
import { 
  PlayCircle, CheckCircle2, Lock, Clock, 
  ChevronRight, Lightbulb, ArrowLeft, MoreVertical 
} from 'lucide-react';

const ProgramPlayer = () => {
  const [activeDay, setActiveDay] = useState(2);

  const curriculum = [
    { day: 1, title: "Foundations", status: "completed" },
    { day: 2, title: "Deep Work Initiation", status: "active" },
    { day: 3, title: "Context Switching", status: "locked" },
    { day: 4, title: "Digital Minimalism", status: "locked" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h2 className="font-black text-slate-900 leading-none">Mastering Sustainable Focus</h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Day {activeDay} of 11</p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-full">
          <MoreVertical size={20} className="text-slate-400" />
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* LEFT: Video Player & Content */}
        <div className="flex-1 space-y-8">
          {/* Video Section */}
          <div className="aspect-video bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative group">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-900/40 hover:scale-110 transition-transform">
                <PlayCircle size={40} fill="currentColor" className="text-blue-200" />
              </button>
            </div>
            {/* Custom Video Controls Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white text-xs font-bold">Module {activeDay}: The Art of Focus</span>
               <span className="text-white text-xs font-bold font-mono text-blue-400">12:45</span>
            </div>
          </div>

          {/* Module Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" /> Active Module
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Day 2: Deep Work Initiation</h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              {`Today, we dive into the core of mindful execution: the 90-minute sprint. You'll learn how to prime your environment and your mind for uninterrupted, high-leverage work.`}
            </p>
          </div>

          {/* Action Task Card */}
          <div className="bg-white border border-blue-100 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">{`Today's Action Task`}</h3>
            </div>

            <ul className="space-y-4">
              {[
                "Identify your 'Big Rock' task for the day—the one thing that moves the needle most.",
                "Clear your physical workspace of all non-essential items (see today's execution tip).",
                "Set a timer for 90 minutes and engage in single-tasking with zero notifications."
              ].map((task, i) => (
                <li key={i} className="flex gap-4 group">
                  <span className="font-black text-blue-600 group-hover:scale-110 transition-transform">0{i+1}.</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{task}</p>
                </li>
              ))}
            </ul>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 active:scale-95">
              Mark Day {activeDay} as Complete <CheckCircle2 size={20} />
            </button>
          </div>
        </div>

        {/* RIGHT: Sidebar (Progress & Curriculum) */}
        <div className="w-full lg:w-80 space-y-6">
          
          {/* Progress Card */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Program Progress</span>
              <span className="text-sm font-black text-blue-600">27%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '27%' }} />
            </div>
            <div className="flex justify-between mt-3">
              <p className="text-[11px] font-bold text-slate-400">3 of 11 Days</p>
              <div className="flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase italic">
                <Clock size={12} /> Reminders On
              </div>
            </div>
          </div>

          {/* Curriculum List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum • Week 1</h4>
            <div className="space-y-2">
              {curriculum.map((item) => (
                <div 
                  key={item.day}
                  className={`p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                    item.status === 'active' 
                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                    : item.status === 'completed'
                    ? "bg-white border-slate-100 opacity-60"
                    : "bg-white border-slate-50 opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {item.status === 'completed' ? (
                      <CheckCircle2 size={18} className="text-blue-600" />
                    ) : item.status === 'locked' ? (
                      <Lock size={18} className="text-slate-300" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                    )}
                    <span className={`text-sm font-bold ${item.status === 'active' ? "text-blue-900" : "text-slate-700"}`}>
                      Day {item.day}: {item.title}
                    </span>
                  </div>
                  {item.status === 'active' && <ChevronRight size={16} className="text-blue-600" />}
                </div>
              ))}
            </div>
            <button className="w-full text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
              View Full Path
            </button>
          </div>

          {/* Execution Tip Box */}
          <div className="bg-blue-600 rounded-[32px] p-6 text-white space-y-4 relative overflow-hidden group shadow-lg shadow-blue-100">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Lightbulb size={80} />
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-200" />
              <span className="text-[10px] font-black uppercase tracking-widest">Execution Tip</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Clear workspaces increase focus by 40%. Remove all visual clutter from your desk before starting.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-200" />
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-300" />
              </div>
              <span className="text-[10px] font-bold text-blue-100">+54 others active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgramPlayer;