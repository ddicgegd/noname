/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

type TabType = "chat" | "idea" | "narration";

export default function FeatureOne() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [inputValue, setInputValue] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ file: File; url: string; isImage: boolean } | null>(null);
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string, file: string | null, imageUrl?: string }[]>([
    { sender: 'bot', text: 'I can generate full UI routes and configure Firestore. What features should your SaaS include?', file: null },
    { sender: 'user', text: 'Build a metrics dashboard with a database backend.', file: null }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image/");
      const url = URL.createObjectURL(file);
      setUploadedFile({ file, url, isImage });
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() && !uploadedFile) return;
    setMessages(prev => [...prev, {
      sender: 'user',
      text: inputValue,
      file: uploadedFile ? uploadedFile.file.name : null,
      imageUrl: uploadedFile?.isImage ? uploadedFile.url : undefined
    }]);
    setInputValue('');
    setUploadedFile(null);
    setActiveTab("chat");
  };

  const handleScrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector("#pricing");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">
      <div className="w-[85%] 2xl:max-w-[1800px] mx-auto bg-gradient-to-b from-white/60 via-white/40 to-white/20 border-t border-t-white/95 border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-[24px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden">
        
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
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-white/90 via-white/75 to-white/55 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] backdrop-blur-md text-[#111111] hover:bg-[#FF4D24] hover:text-white hover:border-[#FF4D24] font-medium px-8 py-4 rounded-[14px] w-fit transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer select-none"
            >
              Start building
            </a>
          </div>

          {/* Right Side: Interactive Mockup Box */}
          <div className="w-full md:w-1/2 bg-white/20 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 border-t md:border-t-0 md:border-l border-white/40 min-h-[450px]">
            {/* Deep glowing background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D24]/10 via-white/50 to-[#326578]/10" />
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[#FF4D24]/20 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
              <div className="absolute bottom-0 left-0 w-[60%] h-[80%] bg-[#326578]/20 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
            </div>

            {/* Glowing Glass Card with Bevel Frame */}
            <div className="relative z-10 w-[80%] max-w-2xl min-h-[475px] bg-gradient-to-b from-white/80 via-white/60 to-white/40 backdrop-blur-[32px] rounded-2xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col overflow-hidden">
              {/* Custom Interactive Tabs */}
              <div className="flex items-center justify-center p-4 border-b border-white/15 bg-white/20">
                <div className="flex p-1 rounded-full bg-gradient-to-b from-white/75 via-white/55 to-white/35 border-t border-t-white/95 border-b border-b-slate-300/60 border-x border-x-white/60 backdrop-blur-md shadow-[0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.03)]">
                  {(["chat", "idea", "narration"] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all duration-300 cursor-pointer ${
                        activeTab === tab
                          ? "bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] border border-slate-200/50"
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
                      className="space-y-4 max-h-[300px] overflow-y-auto pr-2"
                    >
                      {messages.map((msg, idx) => (
                        msg.sender === 'bot' ? (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] shrink-0 shadow-sm flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[16px]">
                                smart_toy
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-white/60 backdrop-blur-md rounded-2xl rounded-tl-sm p-3.5 border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] inline-block">
                                <p className="text-sm text-[#111111] font-medium leading-relaxed">
                                  {msg.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="flex gap-3 flex-row-reverse items-start">
                            <div className="flex-1 flex flex-col items-end">
                              <div className="bg-[#FF4D24]/80 backdrop-blur-md rounded-2xl rounded-tr-sm p-3.5 shadow-sm inline-block max-w-[85%] text-left border border-white/20">
                                {msg.file && (
                                  msg.imageUrl ? (
                                    <div className="mb-2 rounded overflow-hidden max-w-[200px] border border-white/20 bg-white/10">
                                      <img src={msg.imageUrl} alt="attachment" className="w-full h-auto object-cover" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 mb-2 bg-white/20 p-1.5 rounded text-white text-xs">
                                      <span className="material-symbols-outlined text-[14px]">description</span>
                                      <span className="truncate max-w-[120px]">{msg.file}</span>
                                    </div>
                                  )
                                )}
                                {msg.text && (
                                  <p className="text-sm text-white font-medium">
                                    {msg.text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
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
                  {/* File preview if uploaded */}
                  <AnimatePresence>
                    {uploadedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-2 flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-lg p-2 border border-white/60 shadow-sm w-fit max-w-full"
                      >
                        {uploadedFile.isImage ? (
                          <div className="w-6 h-6 rounded shrink-0 overflow-hidden bg-black/5">
                            <img src={uploadedFile.url} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-primary text-[16px]">description</span>
                        )}
                        <span className="text-xs text-[#111111] font-medium truncate max-w-[150px]">
                          {uploadedFile.file.name}
                        </span>
                        <button 
                          onClick={() => setUploadedFile(null)}
                          className="w-5 h-5 rounded-full hover:bg-black/5 flex items-center justify-center ml-1"
                        >
                          <span className="material-symbols-outlined text-[14px] text-[#555555]">close</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Simulated Chat Input Area with Bevel Styling */}
                  <div className="p-3 bg-gradient-to-b from-white/90 via-white/80 to-white/65 backdrop-blur-xl rounded-2xl border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col gap-2 transition-all relative z-20 pointer-events-auto cursor-text" onClick={() => document.getElementById('chat-textarea')?.focus()}>
                    <textarea
                      id="chat-textarea"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask Horizon to build..."
                      className="w-full min-h-[44px] max-h-[120px] resize-none text-[13px] text-[#111111] font-medium placeholder:text-[#555555] placeholder:opacity-70 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-1 custom-scrollbar leading-relaxed pointer-events-auto"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <label className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer pointer-events-auto ${uploadedFile ? 'text-primary bg-primary/10' : 'text-[#555555] hover:bg-black/5'}`}>
                        <input 
                          type="file" 
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileChange} 
                          style={{ display: "none" }}
                        />
                        <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      </label>
                      
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() && !uploadedFile}
                        className="w-8 h-8 rounded-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] border-t border-t-white/50 border-b border-b-[#A8280A] shadow-[0_2px_8px_rgba(255,77,36,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                      >
                        <span className="material-symbols-outlined text-white text-[16px]">
                          arrow_upward
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line with Optical Bevel Split */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_1px_0_rgba(203,213,225,0.4)]" />

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
            <div className="absolute inset-0 overflow-hidden opacity-40">
              <div className="absolute top-1/2 left-1/2 w-[80%] h-[120%] bg-white/40 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Glowing Glass Card with Bevel Frame */}
            <motion.div
              className="relative z-10 w-[80%] max-w-2xl min-h-[385px] bg-gradient-to-b from-white/85 via-white/70 to-white/50 backdrop-blur-[40px] rounded-3xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,1)] p-6 sm:p-8 overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              {/* Header section */}
              <div className="flex items-center justify-between mb-6 border-b border-black/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white/90 to-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_2px_6px_rgba(255,77,36,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]">
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

                {/* Bottom Live Banner with Bevel Pill */}
                <div className="mt-4 p-3 bg-gradient-to-b from-white/95 via-white/85 to-white/70 rounded-xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-between">
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
