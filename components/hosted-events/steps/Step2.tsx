"use client";

import React, { useState } from "react";
import { 
  MapPin, Video, Compass, Map, 
  Monitor, CheckCircle2, Circle 
} from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme"; 

export default function Step2() {
  const [format, setFormat] = useState<"in-person" | "online" | "hybrid">("in-person");

  return (
    <div className="mx-auto px-4 sm:px-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Format Selection & Dynamic Forms */}
        <div className="md:col-span-8 space-y-8 mb-12">
          
          {/* Format Choice Card */}
          <section className={` bg-white p-8 rounded-xl shadow-sm border ${theme.borderLight}`}>
            <h3 className={`${theme.typography.h1} text-2xl mb-6`}>Choose your format</h3>
            <p className="text-base opacity-70 mb-8 max-w-2xl">
              Will this experience be held in person, hosted online, or a blend of both? This helps us provide the right tools for your attendees.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* In-Person Card */}
              <button 
                onClick={() => setFormat("in-person")}
                className={`flex flex-col items-center text-center p-6 border-2 rounded-xl transition-all group ${
                  format === "in-person" ? `${theme.borderAccent} bg-white shadow-md` : `${theme.borderLight} hover:border-gray-400`
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${theme.bgSecondary}`}>
                  <MapPin className={`w-8 h-8 ${format === "in-person" ? theme.textAccent : theme.textDark}`} />
                </div>
                <span className="text-xl font-medium mb-2 block">In-Person</span>
                <p className="text-xs opacity-70">Gather physically at a specific venue or outdoors.</p>
              </button>

              {/* Online Card */}
              <button 
                onClick={() => setFormat("online")}
                className={`flex flex-col items-center text-center p-6 border-2 rounded-xl transition-all group ${
                  format === "online" ? `${theme.borderAccent} bg-white shadow-md` : `${theme.borderLight} hover:border-gray-400`
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${theme.bgSecondary}`}>
                  <Video className={`w-8 h-8 ${format === "online" ? theme.textAccent : theme.textDark}`} />
                </div>
                <span className="text-xl font-medium mb-2 block">Online</span>
                <p className="text-xs opacity-70">A digital experience via Zoom, Meet, or similar.</p>
              </button>

            </div>
          </section>

          {/* Dynamic Context Sections */}
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            
            {/* In-Person Logistics - Renders if 'in-person' or 'hybrid' */}
                  {(format === "in-person" || format === "hybrid") && (
              <section className={`flex-1 bg-white p-8 rounded-xl shadow-sm border-l-4 border-l-[var(--colors-primary)] border-y border-r ${theme.borderLight}`}>
                <div className="flex items-center gap-3 mb-8">
                  <Compass className={theme.textAccent} />
                  <h3 className={`${theme.typography.h1} text-2xl`}>In-Person Logistics</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Venue Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Sanctuary at High Peaks" 
                      className={`w-full bg-transparent border-0 border-b ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none py-2 transition-all`}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Full Address</label>
                    <div className="relative">
                      <Map className="absolute left-0 top-3 w-5 h-5 opacity-50" />
                      <input 
                        type="text" 
                        placeholder="Street, City, State, Zip" 
                        className={`w-full bg-transparent border-0 border-b ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none py-2 pl-8 transition-all`}
                      />
                    </div>
                  </div>
                
                  
                  <div className="col-span-2 mt-4">
                    <label className="text-sm font-semibold mb-2 block">Travel Instructions (Optional)</label>
                    <textarea 
                      rows={3}
                      placeholder="Where to park, hidden entrances, or local transit tips..." 
                      className={`w-full border ${theme.borderLight} rounded-lg p-4 focus:ring-0 focus:${theme.borderAccent} } outline-none transition-all resize-none`}
                    ></textarea>
                  </div>
                </div>
              </section>
                  )}

            {/* Online Settings - Renders if 'online' or 'hybrid' */}
              {(format === "online" || format === "hybrid") && (
                <section className={`flex-1 bg-white p-8 rounded-xl shadow-sm border-l-4 border-l-gray-700 border-y border-r ${theme.borderLight}`}>
                <div className="flex items-center gap-3 mb-8">
                  <Monitor className="text-gray-700" />
                  <h3 className={`${theme.typography.h1} text-2xl`}>Online Settings</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Meeting platform */}
                  {/* <div className="col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Meeting Platform</label>
                    <select className={`w-full bg-transparent border-0 border-b ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none py-3 transition-all cursor-pointer`}>
                      <option>Zoom (Recommended)</option>
                      <option>Google Meet</option>
                      <option>Microsoft Teams</option>
                      <option>Custom Link</option>
                    </select>
                  </div> */}
                  
                  <div className="col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Meeting Link / Invite URL</label>
                    <input 
                      type="url" 
                      placeholder="https://zoom.us/j/..." 
                      className={`w-full bg-transparent border-0 border-b ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none py-3 transition-all`}
                    />
                  </div>
                  
                </div>
              </section>
              )}

          </div>
        </div>

        {/* Sidebar / Guidance */}
        <div className="md:col-span-4 hidden md:block">
          <div className=" top-24 space-y-6">
            
            {/* Coach's Tip */}
            {/* <div className="bg-[#293625] text-white p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-200" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Coach's Tip</h4>
              </div>
              <p className="text-sm italic leading-relaxed text-gray-200">
                "Choosing 'Hybrid' allows you to scale your impact. While the local energy is irreplaceable, offering a digital seat invites seekers from around the world into your community."
              </p>
            </div> */}
            
            {/* Checklist */}
            <div className={`p-6 border ${theme.borderLight} rounded-xl bg-white shadow-sm`}>
              <h4 className="text-sm font-semibold mb-4">Checklist</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${theme.textAccent} shrink-0`} />
                  <span className="text-sm opacity-80">Confirm venue availability</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${theme.textAccent} shrink-0`} />
                  <span className="text-sm opacity-80">Test your recording software</span>
                </li>
                <li className="flex items-start gap-3">
                  <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm opacity-80">Prepare travel instructions PDF</span>
                </li>
              </ul>
            </div>
            
            {/* Inspiring Image */}
            <div className="rounded-xl overflow-hidden h-48 shadow-sm relative group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1545224144-b38cd301e22f?q=80&w=800&h=600&fit=crop" 
                alt="Inspiring Spaces" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-4 left-4 text-white text-sm font-semibold tracking-wide">Inspiring Spaces</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}