// "use client";

// import { useState, useRef } from "react";
// import { ArrowLeft, ArrowRight, Award, Download, CheckCircle, Info } from "lucide-react";
// // Download ke liye: npm install html2canvas jspdf
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// export default function Step5Completion({ onNext, onBack }) {
//   const [certTitle, setCertTitle] = useState("Mastery in Sustainable Living Fundamentals");
//   const [threshold, setThreshold] = useState(100);
//   const certificateRef = useRef(null);

//   // Download Functionality
//   const downloadCertificate = async () => {
//     const element = certificateRef.current;
//     const canvas = await html2canvas(element, { scale: 2 });
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("l", "mm", "a4"); // Landscape
//     const imgProps = pdf.getImageProperties(imgData);
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
//     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//     pdf.save("certificate-preview.pdf");
//   };

//   return (
//     <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
//       <header className="space-y-2">
//         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Completion & Certificate</h2>
//         <p className="text-lg text-slate-600 font-medium">Define how participants earn their rewards.</p>
//       </header>

//       <div className="space-y-8">
//         {/* Threshold Slider */}
//         <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-4">
//           <div className="flex justify-between items-center">
//             <label className="text-[13px] font-black text-slate-700 uppercase tracking-wider">Completion Threshold</label>
//             <span className="text-2xl font-black text-green-500">{threshold}%</span>
//           </div>
//           <input 
//             type="range" 
//             min="0" max="100" 
//             value={threshold} 
//             onChange={(e) => setThreshold(e.target.value)}
//             className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-500"
//           />
//         </div>

//         {/* Certificate Title Input */}
//         <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-4">
//           <label className="text-[13px] font-black text-slate-700 uppercase tracking-wider">Certificate Title</label>
//           <input
//             type="text"
//             className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-green-400 focus:bg-white outline-none transition-all font-bold text-slate-800"
//             value={certTitle}
//             onChange={(e) => setCertTitle(e.target.value)}
//           />
//         </div>

//         {/* --- LIVE CERTIFICATE PREVIEW --- */}
//         <div className="space-y-4">
//           <div className="flex justify-between items-end px-2">
//             <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Live Preview</label>
//             <button 
//               onClick={downloadCertificate}
//               className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
//             >
//               <Download size={14} /> Download Sample
//             </button>
//           </div>

//           {/* Actual Certificate Design */}
//           <div className="relative group">
//             <div 
//               ref={certificateRef}
//               className="w-full aspect-[1.414/1] bg-white border-[16px] border-slate-900 p-1 relative overflow-hidden shadow-2xl"
//               style={{ fontFamily: 'serif' }}
//             >
//               {/* Decorative Border Internal */}
//               <div className="h-full w-full border-4 border-double border-slate-200 flex flex-col items-center justify-center p-12 text-center relative">
                
//                 {/* Background Watermark/Pattern */}
//                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
//                    <Award size={400} />
//                 </div>

//                 <Award className="text-yellow-500 mb-6" size={60} strokeWidth={1.5} />
                
//                 <h4 className="text-slate-400 uppercase tracking-[0.3em] text-xs font-bold mb-4">Certificate of Completion</h4>
                
//                 <p className="text-slate-500 italic text-sm mb-2">This is to certify that</p>
//                 <h3 className="text-3xl font-serif font-bold text-slate-900 mb-6 border-b-2 border-slate-100 px-10 pb-2">
//                   [Participant Name]
//                 </h3>
                
//                 <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-8">
//                   has successfully completed the requirements for the program
//                 </p>
                
//                 <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase mb-10 px-4 py-2 bg-slate-50 rounded-lg">
//                   {certTitle || "Your Program Title"}
//                 </h2>

//                 <div className="flex justify-between w-full mt-auto pt-10 px-10">
//                     <div className="text-left">
//                         <div className="h-[1px] w-32 bg-slate-300 mb-2" />
//                         <p className="text-[10px] font-bold text-slate-400 uppercase">Program Director</p>
//                     </div>
//                     <div className="text-right">
//                         <div className="h-[1px] w-32 bg-slate-300 mb-2" />
//                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Date of Issue</p>
//                     </div>
//                 </div>

//                 {/* Badge Overlay */}
//                 <div className="absolute bottom-16 right-16 rotate-12 opacity-20">
//                     <div className="w-24 h-24 border-4 border-green-500 rounded-full flex items-center justify-center text-green-600 font-black text-xs">
//                         VERIFIED
//                     </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Feedback Alert */}
//         <div className="bg-green-50 border border-green-100 p-6 rounded-[24px] flex gap-4">
//           <Info className="text-green-500 shrink-0" size={20} />
//           <p className="text-xs text-green-800 leading-relaxed font-medium">
//             <strong>Mandatory Feedback:</strong> Participants must submit final program feedback before they are eligible to download their certificate. This helps improve the MMP flow.
//           </p>
//         </div>
//       </div>

//       {/* Footer Navigation */}
//       <div className="flex justify-between items-center pt-10 border-t border-gray-100">
//         <button onClick={onBack} className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-800 transition-all">
//           <ArrowLeft size={18} /> Back
//         </button>
//         <button 
//           onClick={onNext}
//           className="bg-[#10e956] hover:bg-green-500 text-black font-extrabold px-12 py-5 rounded-[24px] flex items-center gap-3 shadow-xl shadow-green-100 active:scale-95 transition-all"
//         >
//           Continue to Step 6 <ArrowRight size={20} />
//         </button>
//       </div>
//     </div>
//   );
// }