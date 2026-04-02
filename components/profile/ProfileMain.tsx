"use client";

import { useState } from "react";
import Image from "next/image";
import { BusinessProfile } from "@/types/client/business-profile";
import { RiDoubleQuotesL } from "react-icons/ri";
import { RiDoubleQuotesR } from "react-icons/ri";

function toEmbedUrl(url: string): string {
  if (!url) return "";
  const ytWatch = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
  const ytShorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;
  const loom = url.match(/loom\.com\/share\/([a-f0-9]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function ProfileMain({ profile }: { profile: BusinessProfile }) {
  const [openSections, setOpenSections] = useState<string[]>(["session", "languages", "pricing", "styles"]);

  const toggle = (key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isOpen = (key: string) => openSections.includes(key);

  const renderEmpty = (text: string) => (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
      <p className="text-sm text-blue-400 font-medium">{text}</p>
    </div>
  );

  const profilePhotoSrc: string | null =
    typeof profile.profilePhoto === "string" && profile.profilePhoto
      ? profile.profilePhoto
      : profile.profilePhoto instanceof File
        ? URL.createObjectURL(profile.profilePhoto)
        : null;

  const embedUrl = profile.introVideo ? toEmbedUrl(profile.introVideo) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-900">
      {/* space-y-28 → space-y-14 for reduced spacing */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-14">

        {/* HERO */}
        <section className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-white bg-gray-200">
                  {profilePhotoSrc ? (
                    <Image src={profilePhotoSrc} alt={profile.name} width={112} height={112} className="object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                  )}
                </div>
                <div className="absolute bottom-1 right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-blue-900">{profile.name}</h1>
                {profile.tagline ? (
                  <p className="mt-2 text-lg text-gray-600 max-w-lg">{profile.tagline}</p>
                ) : (
                  <p className="mt-2 text-blue-400 text-sm">Tagline not provided</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.coachingDomains?.length ? profile.coachingDomains.map((d) => (
                    <span key={d} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{d}</span>
                  )) : null}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.targetAudience?.length ? profile.targetAudience.map((a) => (
                    <span key={a} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{a}</span>
                  )) : null}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="w-full md:w-96 bg-white rounded-3xl p-8 shadow-xl border sticky top-10 space-y-6">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-gray-600">Online Now</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{profile.timezone || "—"}</p>
                <p className="text-xs text-gray-400 uppercase">{profile.languages?.length ? profile.languages.join(", ") : "No languages"}</p>
              </div>
            </div>
            {(profile.priceMin > 0 || profile.priceMax > 0) && (
              <p className="text-center text-sm text-gray-500">
                <span className="font-semibold text-blue-700">
                  {profile.preferredCurrency === "INR" ? "₹" : "$"}{profile.priceMin} – {profile.preferredCurrency === "INR" ? "₹" : "$"}{profile.priceMax}
                </span> / session
              </p>
            )}
            <button
              onClick={() => profile.calendlyUrl && window.open(profile.calendlyUrl, "_blank")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition shadow-md"
            >
              Book Discovery Call
            </button>
            <button onClick={() => window.open(profile.linkedin, "_blank")} className="w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-medium transition">
              Connect With Me
            </button>
            <p className="text-xs text-gray-400 text-center">Typical response time: Under 2 hours</p>
          </div>
        </section>

        {/* OUTCOME */}
        <section className="bg-white border-t-4 border-blue-600 rounded-3xl p-10 shadow-sm space-y-8">
          <p className="text-xs uppercase tracking-widest text-blue-600 font-bold">The Outcome</p>
          {profile.transformation ? (
            <h2 className="text-3xl font-bold text-gray-900 leading-snug max-w-4xl">{profile.transformation}</h2>
          ) : renderEmpty("Transformation details not provided")}
          <div className="grid md:grid-cols-2 gap-6">
            {profile.typicalResults?.length ? profile.typicalResults.map((r, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</div>
                <p className="text-gray-600 text-sm">{r}</p>
              </div>
            )) : null}
          </div>
        </section>

        {/* PROGRAMS */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-blue-900">Programs & Offerings</h2>
          {profile.servicesOffered?.length ? (
            <div className="grid md:grid-cols-3 gap-6">
              {profile.servicesOffered.slice(0, 3).map((service, i) => (
                <div key={i} className={`p-8 rounded-3xl border shadow-sm ${i === 1 ? "border-blue-500 shadow-lg" : "bg-white"}`}>
                  {i === 1 && <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">Most Popular</span>}
                  {i !== 1 && <span className="text-xs px-3 py-1 rounded-full"></span>}
                  <h3 className="text-xl font-semibold mt-4">{service}</h3>
                  <p className="text-sm text-gray-500 mt-2">Tailored {service.toLowerCase()} experience.</p>
                  <p className="text-sm font-semibold mt-4 text-blue-700">${profile.priceMin ?? 0} – ${profile.priceMax ?? 0}</p>
                </div>
              ))}
            </div>
          ) : renderEmpty("No programs added yet")}
        </section>

        {/* ABOUT + EXPERIENCE */}
        <section className="grid md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-blue-900">About {profile.name}</h2>
            {profile.shortBio ? <p className="text-gray-600 leading-relaxed">{profile.shortBio}</p> : renderEmpty("Bio not provided")}
            {profile.methodology && (
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <p className="text-xs uppercase text-blue-600 font-semibold mb-2">Signature Framework</p>
                <p className="font-semibold text-gray-800">{profile.methodology}</p>
              </div>
            )}
            {profile.toolsFrameworks?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.toolsFrameworks.map((t) => <span key={t} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>)}
              </div>
            ) : null}
            {profile.sessionStyles?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.sessionStyles.map((s) => <span key={s} className="px-3 py-1 bg-gray-100 text-sm rounded-full">{s}</span>)}
              </div>
            ) : null}
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-900">Experience & Credibility</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border text-center shadow-sm">
                <p className="text-3xl font-bold text-blue-600">{profile.yearsOfExperience ?? 0}+</p>
                <p className="text-xs text-gray-400 uppercase">Years Experience</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border text-center shadow-sm">
                <p className="text-3xl font-bold text-blue-600">{profile.jpBalance ?? 0}</p>
                <p className="text-xs text-gray-400 uppercase">GP Balance</p>
              </div>
            </div>
            {profile.certifications?.length ? (
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-xs uppercase text-gray-400 font-semibold mb-4">Certifications</p>
                {profile.certifications.map((c, i) => <p key={i} className="text-sm text-gray-700 mb-2">✓ {c}</p>)}
              </div>
            ) : renderEmpty("No certifications added")}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-blue-900">Client Feedback</h2>
          {profile.testimonials?.length ? (
            <div className="grid md:grid-cols-2 gap-6">
              {profile.testimonials.map((t, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border shadow-sm">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    <RiDoubleQuotesL className="inline mr-1 -translate-y-1" />{t.content}<RiDoubleQuotesR className="inline ml-1 -translate-y-1" />
                  </p>
                  <p className="mt-4 font-semibold text-blue-700">{t.name ?? "Anonymous"}</p>
                  <p className="text-xs text-gray-400">{t.role ?? ""}</p>
                </div>
              ))}
            </div>
          ) : renderEmpty("No testimonials yet")}
        </section>

        {/* INTRO VIDEO */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-blue-900">Meet {profile.name}</h2>
          {embedUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-xl max-w-4xl mx-auto">
              <div className="aspect-video">
                <iframe src={embedUrl} className="w-full h-full" loading="lazy" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={`${profile.name} intro video`} />
              </div>
            </div>
          ) : renderEmpty("Intro video not available")}
        </section>

        {/* PRACTICAL DETAILS — 2 columns side by side */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-blue-900">Practical Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Session Duration & Format */}
            <div className="border rounded-2xl bg-white">
              <button onClick={() => toggle("session")} className="w-full p-5 text-left font-semibold flex justify-between items-center">
                Session Duration & Format
                <span className="text-gray-400 text-sm">{isOpen("session") ? "▲" : "▼"}</span>
              </button>
              {isOpen("session") && (
                <div className="px-5 pb-5 text-sm text-gray-600">
                  {profile.sessionDuration || "—"} minutes via {profile.sessionFormat || "Not specified"}.
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="border rounded-2xl bg-white">
              <button onClick={() => toggle("languages")} className="w-full p-5 text-left font-semibold flex justify-between items-center">
                Languages Supported
                <span className="text-gray-400 text-sm">{isOpen("languages") ? "▲" : "▼"}</span>
              </button>
              {isOpen("languages") && (
                <div className="px-5 pb-5 text-sm text-gray-600">
                  {profile.languages?.length ? profile.languages.join(", ") : "No languages specified"}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="border rounded-2xl bg-white">
              <button onClick={() => toggle("pricing")} className="w-full p-5 text-left font-semibold flex justify-between items-center">
                Pricing Range
                <span className="text-gray-400 text-sm">{isOpen("pricing") ? "▲" : "▼"}</span>
              </button>
              {isOpen("pricing") && (
                <div className="px-5 pb-5 text-sm text-gray-600">
                  {profile.preferredCurrency === "INR" ? "₹" : "$"}{profile.priceMin ?? 0} – {profile.preferredCurrency === "INR" ? "₹" : "$"}{profile.priceMax ?? 0}
                </div>
              )}
            </div>

            {/* Session Styles */}
            {profile.sessionStyles?.length ? (
              <div className="border rounded-2xl bg-white">
                <button onClick={() => toggle("styles")} className="w-full p-5 text-left font-semibold flex justify-between items-center">
                  Session Styles
                  <span className="text-gray-400 text-sm">{isOpen("styles") ? "▲" : "▼"}</span>
                </button>
                {isOpen("styles") && (
                  <div className="px-5 pb-5 flex flex-wrap gap-2">
                    {profile.sessionStyles.map((s) => (
                      <span key={s} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

      </main>
    </div>
  );
}

export default ProfileMain;