"use client";

import React, { useState } from 'react';
import { 
  Trophy, Download, Star, Share2, 
  ArrowRight, Award, 
} from 'lucide-react';
import confetti from 'canvas-confetti'; // Install this for that extra 'wow' factor

const CompletionSuccess = () => {
  const [rating, setRating] = useState(0);

  // Magic moment triggers on load
  React.useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#60a5fa', '#ffffff']
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        
        {/* Celebration Header */}
        <div className="space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
            <Trophy size={40} />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            {`You’ve Completed This `}<span className="text-blue-600">Mini-Mastery!</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            {`Congratulations! You've successfully finished the`} <span className="text-slate-900 font-bold">Advanced Creative Strategy</span> program. Your dedication to learning is the key to your growth.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* LEFT: Feedback Card */}
          <div className="flex-1 bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-blue-900/5 text-left space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Share your experience</h3>
              <p className="text-sm text-slate-400 font-medium italic">Your feedback helps us refine the Mini-Mastery experience for everyone.</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating</p>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className={`transition-all ${rating >= s ? "text-blue-600 scale-110" : "text-slate-200 hover:text-blue-200"}`}
                  >
                    <Star size={32} fill={rating >= s ? "currentColor" : "none"} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tell us more</p>
              <textarea 
                placeholder="What was the most valuable part of this program?"
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl min-h-[120px] outline-none focus:ring-2 focus:ring-blue-400 font-medium transition-all"
              />
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95">
              Submit Feedback
            </button>
          </div>

          {/* RIGHT: Certificate Preview Card */}
          <div className="flex-1 bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-blue-900/5 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            
            <div className="w-full flex justify-between items-center mb-6">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                 <Award size={14} /> Your Certificate
               </span>
               <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline">
                 <Download size={14} /> Download PDF
               </button>
            </div>

            {/* Certificate Visual */}
            <div className="w-full aspect-[1.4/1] border-8 border-slate-50 rounded-2xl bg-white p-6 flex flex-col items-center justify-center space-y-4 relative">
              <div className="absolute top-4 right-4">
                 <div className="w-12 h-12 border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-200">
                    <Award size={24} />
                 </div>
              </div>
              <p className="text-[8px] font-bold text-blue-400 tracking-[0.3em] uppercase">Certificate of Completion</p>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 italic">This is to certify that</p>
                <h4 className="text-xl font-black text-slate-900">Alex Rivera</h4>
              </div>
              <div className="w-24 h-px bg-slate-100" />
              <p className="text-[10px] font-bold text-slate-700 max-w-[180px]">Advanced Creative Strategy</p>
            </div>

            <div className="pt-8 w-full">
              <button className="w-full border-2 border-slate-100 text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <Share2 size={18} /> Share Achievement
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="text-left">
              <p className="text-4xl font-black text-slate-900">4.9</p>
              <div className="flex text-blue-600">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Average Program Rating</p>
            </div>
            <div className="h-12 w-px bg-slate-200 hidden md:block" />
            <div className="space-y-2 min-w-[200px]">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 w-8">5 STAR</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600" style={{ width: '92%' }} />
                </div>
                <span className="text-[10px] font-black text-slate-400">92%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 w-8">4 STAR</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-300" style={{ width: '7%' }} />
                </div>
                <span className="text-[10px] font-black text-slate-400">7%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-sm font-bold text-slate-900">Ready for the next one?</p>
            <button className="bg-slate-900 text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all group">
              Browse More Programs <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompletionSuccess;