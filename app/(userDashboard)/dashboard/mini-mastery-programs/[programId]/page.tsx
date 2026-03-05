// import React from 'react';
// import { 
//   CheckCircle2, Lock, Clock, GraduationCap, 
//   ArrowRight, Target, LayoutPanelLeft, Info 
// } from 'lucide-react';

// const ProgramDetails = () => {
//   const achievements = [
//     { title: "Deep Work Habits", desc: "Master the art of single-tasking for extended periods." },
//     { title: "Digital Minimalism", desc: "Learn to curate your digital environment for zero distraction." },
//     { title: "Sustainable Rhythm", desc: "Avoid burnout with energy-mapped work sessions." },
//     { title: "Systematized Review", desc: "Build daily and weekly routines to maintain momentum." },
//   ];

//   const modules = [
//     "Foundations of Focus: Audit Your Time",
//     "Deep Work Initiation: The First 90 Minutes",
//     "Designing Your Distraction-Free Workspace",
//     "The Science of Flow: Entering the Zone",
//     "Energy Management vs Time Management",
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 pb-20">
//       {/* Top Hero Section */}
//       <div className="max-w-6xl mx-auto px-4 pt-12">
//         <div className="flex flex-col lg:flex-row gap-12 items-start">
          
//           {/* Left: Program Image */}
//           <div className="w-full lg:w-1/2 aspect-square rounded-[40px] overflow-hidden shadow-2xl shadow-blue-100 relative group">
//             <img 
//               src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800" 
//               alt="Course" 
//               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
//           </div>

//           {/* Right: Intro Info */}
//           <div className="w-full lg:w-1/2 space-y-8">
//             <div className="space-y-4">
//               <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
//                 Self-Guided Experience
//               </span>
//               <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
//                 Mastering Sustainable <span className="text-blue-600">Focus</span>
//               </h1>
//               <p className="text-xl text-slate-500 font-medium italic">
//                 Build a resilient productivity system in 11 days.
//               </p>
//             </div>

//             {/* Price & Stats Card */}
//             <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <div className="space-y-1">
//                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
//                     <Clock size={14} /> Duration
//                   </p>
//                   <p className="text-xl font-black text-slate-800">11 Days</p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
//                     <GraduationCap size={14} /> Benefit
//                   </p>
//                   <p className="text-sm font-bold text-blue-600 flex items-center gap-1">
//                     <CheckCircle2 size={16} fill="currentColor" className="text-white" /> Certificate Included
//                   </p>
//                 </div>
//               </div>

//               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
//                 <div>
//                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Investment</p>
//                   <p className="text-3xl font-black text-slate-900">₹499</p>
//                 </div>
//                 <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-blue-200 active:scale-95">
//                   Enroll Now <ArrowRight size={20} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content Sections */}
//       <div className="max-w-6xl mx-auto px-4 mt-20 space-y-24">
        
//         {/* Achievements Section */}
//         <section className="space-y-10">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
//               <Target size={24} />
//             </div>
//             <h2 className="text-3xl font-black text-slate-900 tracking-tight">What You'll Achieve</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {achievements.map((item, idx) => (
//               <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl flex items-start gap-4 hover:border-blue-200 transition-colors group">
//                 <div className="mt-1 bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
//                   <CheckCircle2 size={18} />
//                 </div>
//                 <div>
//                   <h4 className="font-black text-slate-800">{item.title}</h4>
//                   <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Structure Section */}
//         <section className="space-y-10">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
//                 <LayoutPanelLeft size={24} />
//               </div>
//               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Program Structure</h2>
//             </div>
//             <span className="text-sm font-bold text-slate-400 italic">11 Modules • 11 Days</span>
//           </div>

//           <div className="space-y-3">
//             {modules.map((title, idx) => (
//               <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
//                 <div className="flex items-center gap-6">
//                   <span className="text-xs font-black text-blue-300 group-hover:text-blue-600 transition-colors">0{idx + 1}</span>
//                   <h4 className="font-bold text-slate-700">{title}</h4>
//                 </div>
//                 <Lock size={18} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
//               </div>
//             ))}
//             <div className="p-5 text-center bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold tracking-widest uppercase">
//               Days 06 - 10: Advanced Resilience Techniques
//             </div>
//           </div>
//         </section>

//         {/* Bottom Requirement Banner */}
//         <div className="bg-blue-600 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
//           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
//           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
//             <Info size={32} />
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-2xl font-black">Completion Requirement</h3>
//             <p className="text-blue-100 text-sm leading-relaxed max-w-2xl font-medium">
//               Requires 100% completion and final feedback to unlock certificate. All daily tasks must be marked as done within the platform to qualify for the official MyThriveBuddy digital credential.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProgramDetails;

import React from 'react';
import { 
  CheckCircle2, Lock, Clock, GraduationCap, 
  ArrowRight, Target, LayoutPanelLeft, Info, Play 
} from 'lucide-react';

const ProgramDetails = () => {
  const achievements = [
    { title: "Deep Work Habits", desc: "Master the art of single-tasking for extended periods." },
    { title: "Digital Minimalism", desc: "Learn to curate your digital environment for zero distraction." },
    { title: "Sustainable Rhythm", desc: "Avoid burnout with energy-mapped work sessions." },
    { title: "Systematized Review", desc: "Build daily and weekly routines to maintain momentum." },
  ];

  const modules = [
    "Foundations of Focus: Audit Your Time",
    "Deep Work Initiation: The First 90 Minutes",
    "Designing Your Distraction-Free Workspace",
    "The Science of Flow: Entering the Zone",
    "Energy Management vs Time Management",
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-100">
      {/* Top Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          
          {/* Left: YouTube Video Preview */}
          <div className="w-full lg:w-1/2 aspect-video rounded-[32px] overflow-hidden shadow-2xl shadow-blue-100/50 bg-black relative group border-4 border-white">
            <iframe 
              className="w-full h-full object-cover"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0" // Apni ID yha dalo
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
            {/* Overlay for aesthetic if video is not playing */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 pointer-events-none">
                <Play size={12} className="text-white fill-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Preview Lesson</span>
            </div>
          </div>

          {/* Right: Intro Info */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="space-y-3">
              <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                Self-Guided Experience
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                Mastering Sustainable <span className="text-blue-600">Focus</span>
              </h1>
              <p className="text-base text-slate-500 font-medium leading-relaxed max-w-md">
                Build a resilient productivity system and reclaim your attention in just 11 days.
              </p>
            </div>

            {/* Price & Stats Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <Clock size={12} /> Duration
                  </p>
                  <p className="text-lg font-bold text-slate-800">11 Days</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <GraduationCap size={12} /> Benefit
                  </p>
                  <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <CheckCircle2 size={14} fill="currentColor" className="text-blue-50" /> Certificate Included
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Investment</p>
                  <p className="text-2xl font-black text-slate-900">₹499</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm">
                  Enroll Now <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-20">
        {/* Achievements Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
              <Target size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{`What You'll Achieve`}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-start gap-4 hover:border-blue-200 transition-colors group shadow-sm">
                <div className="mt-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Structure Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
                <LayoutPanelLeft size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Program Structure</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 italic">11 Modules • 11 Days</span>
          </div>

          <div className="space-y-2.5">
            {modules.map((title, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-blue-300 group-hover:text-blue-600 transition-colors">0{idx + 1}</span>
                  <h4 className="text-sm font-bold text-slate-700">{title}</h4>
                </div>
                <Lock size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
              </div>
            ))}
            <div className="p-4 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
              Days 06 - 10: Advanced Resilience Techniques
            </div>
          </div>
        </section>

        {/* Bottom Requirement Banner */}
        <div className="bg-blue-600 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-xl shadow-blue-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-sm">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black italic">Completion Requirement</h3>
            <p className="text-blue-50 text-[12px] leading-relaxed max-w-2xl font-medium opacity-90">
              Requires 100% completion and final feedback to unlock certificate. All daily tasks must be marked as done within the platform to qualify for the official MyThriveBuddy digital credential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetails;