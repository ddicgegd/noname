/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { motion } from "motion/react";

export default function ShowcaseSection() {
  const cards = [
    {
      title: "Streaming Dashboard",
      bgColor: "bg-[#38BDF8]/10",
      accentGlow: "from-blue-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
          <div className="h-6 px-3 bg-black/5 rounded-full w-fit flex items-center">
            <span className="font-sans text-xs text-[#555555] font-semibold">Streaming Dashboard</span>
          </div>
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="h-28 bg-[#38BDF8]/20 border border-white/50 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#38BDF8] text-2xl">monitoring</span>
            </div>
            <div className="h-28 bg-[#C084FC]/20 border border-white/50 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#C084FC] text-2xl">bubble_chart</span>
            </div>
          </div>
          <div className="h-8 bg-white/80 rounded-lg border border-black/5 flex items-center px-3 justify-between">
            <div className="w-16 h-2 bg-black/10 rounded-full" />
            <div className="w-4 h-4 rounded-full bg-[#38BDF8]" />
          </div>
        </div>
      ),
    },
    {
      title: "Finance Ledger",
      bgColor: "bg-[#C084FC]/10",
      accentGlow: "from-purple-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
          <div className="h-6 px-3 bg-black/5 rounded-full w-fit flex items-center">
            <span className="font-sans text-xs text-[#555555] font-semibold">Finance Ledger</span>
          </div>
          <div className="flex-1 border-t border-b border-black/5 flex flex-col gap-3 py-4 my-2">
            <div className="h-4 bg-white/80 rounded border border-black/5 w-full flex items-center px-2 justify-between">
              <div className="w-12 h-1.5 bg-black/10 rounded-full" />
              <div className="w-8 h-1.5 bg-green-400 rounded-full" />
            </div>
            <div className="h-4 bg-white/80 rounded border border-black/5 w-5/6 flex items-center px-2 justify-between">
              <div className="w-16 h-1.5 bg-black/10 rounded-full" />
              <div className="w-6 h-1.5 bg-green-400 rounded-full" />
            </div>
            <div className="h-4 bg-white/80 rounded border border-black/5 w-full flex items-center px-2 justify-between">
              <div className="w-10 h-1.5 bg-black/10 rounded-full" />
              <div className="w-10 h-1.5 bg-red-400 rounded-full" />
            </div>
          </div>
          <div className="h-8 w-24 bg-[#FF4D24] text-white font-sans text-xs font-semibold flex items-center justify-center rounded-full self-end shadow-sm">
            Export CSV
          </div>
        </div>
      ),
    },
    {
      title: "Travel Planner",
      bgColor: "bg-[#FF9A9E]/10",
      accentGlow: "from-pink-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
          <div className="flex gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FF4D24]/20 border border-white/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">map</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-sans text-xs text-black font-bold">Travel Planner</span>
              <span className="text-[9px] text-[#555555] font-semibold uppercase tracking-wider">4 Days in Paris</span>
            </div>
          </div>
          <div className="flex-1 bg-white/50 rounded-lg border border-white/60 p-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-black">Day 1: Eiffel Tower</span>
                <span className="text-primary font-bold">09:00 AM</span>
              </div>
              <div className="w-full h-1 bg-black/5 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-black">Day 2: Louvre Museum</span>
                <span className="text-primary font-bold">02:30 PM</span>
              </div>
              <div className="w-full h-1 bg-black/5 rounded-full" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Photo Hub",
      bgColor: "bg-[#FFD166]/10",
      accentGlow: "from-yellow-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 grid grid-cols-2 gap-3">
          <div className="bg-white/80 rounded-lg border border-black/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-600 text-lg">photo_camera</span>
          </div>
          <div className="bg-white/80 rounded-lg border border-black/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-600 text-lg">filter_vintage</span>
          </div>
          <div className="bg-white/80 rounded-lg border border-black/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-600 text-lg">wb_sunny</span>
          </div>
          <div className="bg-white/80 rounded-lg border border-black/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-600 text-lg">image</span>
          </div>
        </div>
      ),
    },
    {
      title: "Task Kanban",
      bgColor: "bg-[#4ADE80]/10",
      accentGlow: "from-green-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
          <div className="h-6 px-3 bg-black/5 rounded-full w-fit flex items-center">
            <span className="font-sans text-xs text-[#555555] font-semibold">Task Kanban</span>
          </div>
          <div className="flex gap-2 my-3 flex-1 overflow-hidden">
            <div className="flex-1 bg-white/80 rounded-lg border border-black/5 p-2.5 flex flex-col gap-2">
              <div className="h-1.5 bg-black/10 rounded-full w-2/3" />
              <div className="h-8 bg-green-500/10 border border-green-500/20 rounded flex items-center px-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 shrink-0" />
                <div className="h-1 bg-green-500/25 rounded-full flex-1" />
              </div>
            </div>
            <div className="flex-1 bg-white/80 rounded-lg border border-black/5 p-2.5 flex flex-col gap-2">
              <div className="h-1.5 bg-black/10 rounded-full w-2/3" />
              <div className="h-8 bg-blue-500/10 border border-blue-500/20 rounded flex items-center px-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 shrink-0" />
                <div className="h-1 bg-blue-500/25 rounded-full flex-1" />
              </div>
            </div>
          </div>
          <div className="h-6 w-full bg-black/5 rounded flex items-center px-2 justify-between">
            <div className="w-12 h-1 bg-black/15 rounded-full" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>
      ),
    },
    {
      title: "Music Player",
      bgColor: "bg-[#F472B6]/10",
      accentGlow: "from-pink-500/10 to-transparent",
      renderInner: () => (
        <div className="relative z-10 h-full bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-[#F472B6]/20 rounded-lg flex items-center justify-center border border-[#F472B6]/30">
              <span className="material-symbols-outlined text-pink-600 text-xl">music_note</span>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-black/20 rounded-full w-3/4 mb-1" />
              <div className="h-1.5 bg-black/10 rounded-full w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center my-4">
            <span className="material-symbols-outlined text-black/30 text-base">skip_previous</span>
            <span className="material-symbols-outlined text-black/70 text-2xl">play_circle</span>
            <span className="material-symbols-outlined text-black/30 text-base">skip_next</span>
          </div>
          <div className="w-full h-1 bg-black/5 rounded-full relative">
            <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-pink-500/80 rounded-full" />
          </div>
        </div>
      ),
    },
  ];

  // Double the array to enable infinite seamless loop
  const doubleCards = [...cards, ...cards];

  return (
    <section id="showcase" className="py-10 bg-transparent relative overflow-hidden select-none pointer-events-none">
      {/* CSS stylesheet to run custom high-performance hardware-accelerated infinite marquee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee-scroll 28s linear infinite;
        }
      ` }} />

      {/* Dynamic background dot mesh */}
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#C084FC 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.2 }} />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-16 flex flex-col items-center justify-center mb-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl text-[#111111] font-display font-light leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Seamless integration from idea to execution
          </motion.h2>
        </div>
      </div>

      {/* Infinite loop marquee with fading gradient edges */}
      <div className="w-full relative z-10 overflow-hidden py-2">
        {/* Left and right feathered fading blur overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-48 bg-gradient-to-r from-[#E4E4E4] via-[#E4E4E4]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-48 bg-gradient-to-l from-[#E4E4E4] via-[#E4E4E4]/80 to-transparent z-20 pointer-events-none" />

        <div
          className="animate-marquee gap-4 pb-6"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
          }}
        >
          {doubleCards.map((card, i) => (
            <div
              key={`${card.title}-${i}`}
              className="shrink-0 w-[310px] sm:w-[410px] h-[300px] bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-md flex flex-col overflow-hidden"
            >
              <div className={`h-full ${card.bgColor} relative overflow-hidden p-5 flex flex-col justify-between`}>
                <div className={`absolute inset-0 bg-gradient-to-t ${card.accentGlow} opacity-50`} />
                {card.renderInner()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
