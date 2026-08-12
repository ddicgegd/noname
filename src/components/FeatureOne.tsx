/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type TabType = "chat" | "idea" | "narration";

export default function FeatureOne() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  const handleScrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector("#pricing");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">
      <div className="w-[85%] 2xl:max-w-[1800px] mx-auto bg-white/40 backdrop-blur-2xl rounded-[20px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* FIRST FEATURE: Tell Horizon your SaaS idea... */}
        <div className="flex flex-col md:flex-row min-h-[596px]">
          {/* Left Side: Copywriting */}
          <div className="p-8 sm:p-12 w-full md:w-1/2 flex flex-col justify-center">
            <span className="font-display font-bold text-xs uppercase text-primary mb-4 tracking-widest">
              01 / 04
            </span>
            <h3 className="font-display text-3xl sm:text-4xl text-[#111111] font-bold mb-6 leading-tight">
              Tell Horizon your SaaS idea...
            </h3>
            <p className="font-sans text-base sm:text-lg text-[#555555] mb-8 max-w-md">
              Transform your ideas into functional applications seamlessly. Our intuitive builder lets you craft complex interfaces and logics without traditional coding constraints.
            </p>
            <a
              href="#pricing"
              onClick={handleScrollToPricing}
              className="inline-flex items-center justify-center gap-2 bg-white/50 border border-white/60 shadow-sm backdrop-blur-md text-[#111111] hover:bg-[#FF4D24] hover:text-white hover:border-[#FF4D24] font-medium px-8 py-4 rounded-[12px] w-fit transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              Start building
            </a>
          </div>

          {/* Right Side: Interactive Mockup Box */}
          <div className="w-full md:w-1/2 bg-white/20 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 border-t md:border-t-0 md:border-l border-white/40 min-h-[450px]">
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D24]/10 via-white/50 to-[#326578]/10" />
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF4D24]/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#326578]/20 rounded-full blur-[100px]" />
            </div>

            {/* Interactive Chat Card */}
            <div className="relative z-10 w-full max-w-[420px] bg-white/40 backdrop-blur-[32px] rounded-2xl border border-white/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
              {/* Custom Interactive Tabs */}
              <div className="flex items-center justify-center p-4 border-b border-white/10 bg-white/20">
                <div className="flex p-1 rounded-full border border-white/20 backdrop-blur-md bg-white/40">
                  {(["chat", "idea", "narration"] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all duration-300 ${
                        activeTab === tab
                          ? "bg-white text-primary shadow-sm"
                          : "text-[#111111] hover:text-primary"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content area with smooth transition based on state */}
              <div className="flex-1 p-6 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeTab === "chat" && (
                    <motion.div
                      key="chat-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Bot Message */}
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] shrink-0 shadow-sm flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[16px]">
                            smart_toy
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-white/60 backdrop-blur-md rounded-2xl rounded-tl-sm p-3.5 border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] inline-block">
                            <p className="text-sm text-[#111111] font-medium leading-relaxed">
                              I can generate full UI routes and configure Firestore. What features should your SaaS include?
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Message */}
                      <div className="flex gap-3 flex-row-reverse items-start">
                        <div className="flex-1 flex flex-col items-end">
                          <div className="bg-[#111111] rounded-2xl rounded-tr-sm p-3.5 shadow-sm inline-block max-w-[85%] text-left">
                            <p className="text-sm text-white font-medium">
                              Build a metrics dashboard with a database backend.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "idea" && (
                    <motion.div
                      key="idea-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-yellow-400/20 shrink-0 border border-white/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-yellow-600 text-[14px] font-bold">
                            lightbulb
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="text-xs font-bold text-[#111111]">Dashboard Flow Map</h4>
                          <div className="bg-white/40 rounded-xl p-3 border border-white/60 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-[11px] font-semibold text-[#111111]">Route: /api/metrics</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-[11px] font-semibold text-[#111111]">Database: cloudsql_setup</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "narration" && (
                    <motion.div
                      key="narration-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 text-left"
                    >
                      <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                        <span className="text-[10px] font-bold text-[#555555] uppercase tracking-wider block mb-1">
                          Active Agent Voice
                        </span>
                        <p className="text-xs text-[#111111] italic">
                          "Creating a beautiful dashboard landing page complete with fully responsive chart cards, a dark cosmic background, and synchronized navigation menus."
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Static Preview and Mock Input Area */}
                <div className="pt-4 mt-auto">
                  {/* Generated Preview Block */}
                  <div className="mb-4 bg-white/40 backdrop-blur-md rounded-xl p-3 border border-white/60 shadow-sm flex items-center justify-between cursor-pointer hover:bg-white/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111111]">Dashboard Generated</p>
                        <p className="text-[10px] text-[#555555]">3 components, 1 database schema</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#111111] text-[16px]">open_in_new</span>
                  </div>

                  {/* Simulated Chat Input Area */}
                  <div className="p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center gap-2 transition-all">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#555555] hover:bg-black/5 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                    </button>
                    <div className="flex-1 text-[13px] text-[#555555] font-medium opacity-70">
                      Ask Horizon to build...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                      <span className="material-symbols-outlined text-white text-[16px]">
                        arrow_upward
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div className="border-t border-white/40" />

        {/* SECOND FEATURE: A backend for your SaaS */}
        <div className="flex flex-col md:flex-row-reverse min-h-[596px]">
          {/* Right Side: Copywriting */}
          <div className="p-8 sm:p-12 w-full md:w-1/2 flex flex-col justify-center">
            <span className="font-display font-bold text-xs uppercase text-primary mb-4 tracking-widest">
              02 / 04
            </span>
            <h3 className="font-display text-3xl sm:text-4xl text-[#111111] font-bold mb-6 leading-tight">
              A backend for your SaaS
            </h3>
            <p className="font-sans text-base sm:text-lg text-[#555555] mb-8 max-w-md">
              Robust infrastructure generated instantly. From authentication to database schemas, Horizon writes the backend so you can focus on the user experience.
            </p>
          </div>

          {/* Left Side: Mockup dashboard */}
          <div className="w-full md:w-1/2 bg-white/10 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 border-t md:border-t-0 md:border-r border-white/40 min-h-[450px]">
            {/* Deep glowing background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D24]/20 via-transparent to-[#326578]/10" />
            <div className="absolute inset-0 opacity-30 mix-blend-soft-light" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #ffffff 0%, transparent 100%)" }} />

            {/* Glowing Glass Card */}
            <motion.div
              className="relative z-10 w-full max-w-[380px] bg-white/60 backdrop-blur-[40px] rounded-3xl border border-white/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] p-6 sm:p-8 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              {/* Header section */}
              <div className="flex items-center justify-between mb-6 border-b border-black/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-xl">
                      cloud_upload
                    </span>
                  </div>
                  <div>
                    <span className="block text-black font-bold text-sm leading-none">
                      Deployment
                    </span>
                    <span className="text-black/50 text-[10px] font-bold uppercase tracking-widest block mt-1">
                      v1.2.0-stable
                    </span>
                  </div>
                </div>

                {/* Sparkline Graph */}
                <div className="flex flex-col items-end gap-1 select-none">
                  <div className="text-[10px] font-bold text-[#555555] uppercase tracking-tighter">
                    Health
                  </div>
                  <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                    <path
                      d="M0 15 L10 12 L20 18 L30 8 L40 10 L50 4 L60 6"
                      fill="none"
                      stroke="#27C93F"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Core Health indicators */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.8)] animate-pulse" />
                      <span className="text-black">Edge Runtime</span>
                    </div>
                    <span className="text-black font-mono">99.9%</span>
                  </div>
                  <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden border border-black/5">
                    <div className="h-full w-[88%] bg-gradient-to-r from-primary to-primary/60 rounded-full animate-[progress_2s_ease-out]" />
                  </div>
                </div>

                {/* Console operations logs style */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between text-[#555555] text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] font-bold text-[#27C93F]">
                        verified_user
                      </span>
                      <span>SSL Certification active</span>
                    </div>
                    <span className="font-mono opacity-60">12:45:01</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555555] text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] font-bold text-[#27C93F]">
                        storage
                      </span>
                      <span>Database migration 100%</span>
                    </div>
                    <span className="font-mono opacity-60">12:45:03</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555555] text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <span>CDN Edge propagation...</span>
                    </div>
                    <span className="font-mono opacity-60">Running</span>
                  </div>
                </div>

                {/* Bottom Live Banner */}
                <div className="mt-4 p-3 bg-white/80 rounded-xl border border-white shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#27C93F] text-[18px] font-bold">
                      check_circle
                    </span>
                    <span className="text-black text-[12px] font-bold">
                      Live in production
                    </span>
                  </div>
                  <span className="text-[#555555] text-[10px] font-mono font-bold px-2 py-0.5 bg-black/5 rounded">
                    0.4ms
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
