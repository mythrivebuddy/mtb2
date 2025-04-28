"use client";

import React from "react";
import { motion } from "framer-motion";

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 flex flex-col items-center p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="max-w-6xl text-center mb-20"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-6 leading-tight">
          Welcome to <span className="text-blue-600">MyThriveBuddy.com</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600">
          Your trusted companion for daily wins, and joy pearls growth. 🪙
        </p>
      </motion.div>

      {/* Quick Highlights */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.3 } },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
      >
        {[
          { title: "Track", desc: "Monitor your daily tasks effortlessly." },
          { title: "Celebrate", desc: "Every small win deserves a big cheer." },
          { title: "Grow", desc: "Progress towards your dreams sustainably." },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition hover:scale-105"
          >
            <h3 className="text-2xl font-semibold text-blue-700 mb-4">{item.title}</h3>
            <p className="text-gray-600">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* About Section */}
      <motion.section
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl text-center mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Born from a simple idea — that progress should feel good, not overwhelming. 
          <span className="font-semibold text-blue-600"> MyThriveBuddy</span> was created for dreamers, doers, 
          and everyday heroes chasing growth at their own pace. We believe every small aligned action creates a ripple of greatness. 🌟
        </p>
      </motion.section>

      {/* Vision Mission */}
      <motion.section
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl text-center mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Vision & Mission</h2>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          We envision a world where success is measured by daily commitment, not just results. 
          Our mission is to create joyful, sustainable tools that turn your ambitions into tangible aligned actions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-10">
          <div className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition">
            <h3 className="text-2xl font-semibold text-blue-700 mb-4">Vision</h3>
            <p className="text-gray-600">
              Empower individuals to thrive authentically and build lives they love — one action, one habit, one day at a time.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition">
            <h3 className="text-2xl font-semibold text-blue-700 mb-4">Mission</h3>
            <p className="text-gray-600">
              Celebrate progress, simplify task-tracking, and inspire joy in every micro-win you create daily.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl text-center mb-20"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Why Choose Us? 🚀</h2>
        <ul className="text-gray-600 text-lg space-y-4">
          <li>✨ Easy-to-use platform, beautifully designed for your journey</li>
          <li>🌱 Community-focused encouragement, not competition</li>
          <li>🔔 Personalized reminders to keep your actions aligned</li>
          <li>🎯 Built for real people chasing real dreams at their own pace</li>
        </ul>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-blue-700 mb-4">Ready to Thrive?</h2>
        <p className="text-lg text-gray-600 mb-6">
          Let’s build your dreams — one small, powerful step at a time. 🌿
        </p>
        <button className="bg-blue-600 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-blue-700 transition">
          Join the Journey 🚀
        </button>
      </motion.section>
    </div>
  );
};

export default AboutUsPage;
