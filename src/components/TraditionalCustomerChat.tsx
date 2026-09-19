'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShimmerLoader } from '@/components/ui/shimmer-loader';
import { TypeWritter } from '@/components/ui/typing-writter';

export interface BotBubbleData {
  id: string;
  loader?: {
    labels: string[];
    icons: string[];
    duration: number;
    tokenTarget?: number;
    showPercent?: boolean;
  };
  lines?: string[];
  message?: string;
}

export interface TraditionalCustomerChatProps {
  key?: React.Key;
  replayKey?: number;
  onReplay?: () => void;
  externalMessage?: { text: string; file?: string } | null;
  className?: string;
}

export function TraditionalCustomerChat({
  replayKey = 0,
  externalMessage,
  className,
}: TraditionalCustomerChatProps) {
  const [customerText, setCustomerText] = useState(
    'Hệ thống checkout bị nghẽn thanh toán khi lượng truy cập tăng đột biến, tỷ lệ drop-off lên tới 35%. Cần giải pháp xử lý gấp!'
  );
  const [customerStatus, setCustomerStatus] = useState<'sending' | 'sent'>('sending');
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>(undefined);

  // Active bot bubbles in the chat stream
  const [activeBubbleIndex, setActiveBubbleIndex] = useState<number>(-1);
  const [bubble1Lines, setBubble1Lines] = useState<string[]>([]);
  const [bubble2Ready, setBubble2Ready] = useState(false);
  const [bubble3Ready, setBubble3Ready] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [customerStatus, activeBubbleIndex, bubble1Lines, bubble2Ready, bubble3Ready, scrollToBottom]);

  // Handle replay / initial load
  useEffect(() => {
    setCustomerText(
      'Hệ thống checkout bị nghẽn thanh toán khi lượng truy cập tăng đột biến, tỷ lệ drop-off lên tới 35%. Cần giải pháp xử lý gấp!'
    );
    setUploadedFileName(undefined);
    setCustomerStatus('sending');
    setActiveBubbleIndex(-1);
    setBubble1Lines([]);
    setBubble2Ready(false);
    setBubble3Ready(false);

    // Customer message sending -> sent
    const t1 = setTimeout(() => {
      setCustomerStatus('sent');
    }, 450);

    // Bot Bubble 1 appears
    const t2 = setTimeout(() => {
      setActiveBubbleIndex(1);
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replayKey]);

  // Handle external message from input
  useEffect(() => {
    if (!externalMessage) return;

    setCustomerText(externalMessage.text);
    setUploadedFileName(externalMessage.file);
    setCustomerStatus('sending');
    setActiveBubbleIndex(-1);
    setBubble1Lines([]);
    setBubble2Ready(false);
    setBubble3Ready(false);

    const t1 = setTimeout(() => {
      setCustomerStatus('sent');
    }, 400);

    const t2 = setTimeout(() => {
      setActiveBubbleIndex(1);
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [externalMessage]);

  // Sequence progression handlers
  const handleBubble1LoaderComplete = useCallback(() => {
    // Start typing lines
    setBubble1Lines(['Lock Contention Detected']);
  }, []);

  const handleLine1Complete = useCallback(() => {
    setBubble1Lines((prev) =>
      prev.length === 1 ? [...prev, 'DB Connection Pool 100%'] : prev
    );
  }, []);

  const handleLine2Complete = useCallback(() => {
    setBubble1Lines((prev) =>
      prev.length === 2 ? [...prev, 'Optimization Solution Ready'] : prev
    );
  }, []);

  const handleLine3Complete = useCallback(() => {
    // Bubble 1 complete -> show Bubble 2 after brief pause
    setTimeout(() => {
      setActiveBubbleIndex(2);
    }, 450);
  }, []);

  const handleBubble2LoaderComplete = useCallback(() => {
    setBubble2Ready(true);
    // Bubble 2 complete -> show Bubble 3 after brief pause
    setTimeout(() => {
      setActiveBubbleIndex(3);
    }, 500);
  }, []);

  const handleBubble3LoaderComplete = useCallback(() => {
    setBubble3Ready(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <div
        ref={scrollRef}
        className={`space-y-3.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1 min-h-[280px] max-h-[385px] px-1 pt-3.5 pb-12 [mask-image:linear-gradient(to_bottom,transparent_0,black_14px,black_calc(100%-16px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_14px,black_calc(100%-16px),transparent_100%)] ${
          className || ''
        }`}
      >
        {/* ── 1. CUSTOMER CHAT BUBBLE (Right) ──────────────────────── */}
        <div className="flex gap-2 flex-row-reverse items-start">
          <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-black text-white shrink-0 flex items-center justify-center shadow-xs text-[10px] font-bold select-none">
            KH
          </div>
          <div className="flex flex-col items-end max-w-[85%]">
            <div className="bg-gradient-to-br from-[#FF4D24] to-[#e03a12] text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-[0_4px_16px_rgba(255,77,36,0.2)] border border-white/20">
              {uploadedFileName && (
                <div className="flex items-center gap-1 mb-1 bg-black/15 px-2 py-0.5 rounded text-white text-[11px]">
                  <span className="material-symbols-outlined text-[13px]">description</span>
                  <span className="truncate max-w-[130px]">{uploadedFileName}</span>
                </div>
              )}
              <p className="text-[12.5px] font-medium leading-relaxed">{customerText}</p>
            </div>

            {/* Sending status */}
            <div className="flex items-center gap-1 mt-0.5 text-[9.5px] text-[#777777] pr-1 select-none">
              {customerStatus === 'sending' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Đang gửi…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[12px] text-emerald-600 font-bold">
                    done_all
                  </span>
                  <span>Đã gửi</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. BOT CHAT BUBBLE 1: Chẩn đoán sự cố ─────────────────── */}
        {activeBubbleIndex >= 1 && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-xs mt-0.5 select-none">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-md rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] flex flex-col gap-2 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-1-${replayKey}`}
                labels={['Scanning…', 'Analysing…', 'Detecting…', 'Profiling…']}
                icons={['✦', '◆', '✶', '❋', '✸']}
                duration={2500}
                tokenTarget={0.6}
                showPercent={true}
                onComplete={handleBubble1LoaderComplete}
              />

              {bubble1Lines.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                  <TypeWritter
                    key="line-1"
                    text={bubble1Lines[0]}
                    speed={18}
                    style={{ color: '#1e293b', fontSize: 12, fontWeight: 500 }}
                    onComplete={handleLine1Complete}
                  />
                  {bubble1Lines.length > 1 && (
                    <TypeWritter
                      key="line-2"
                      text={bubble1Lines[1]}
                      speed={18}
                      style={{ color: '#dc2626', fontSize: 12, fontWeight: 500 }}
                      onComplete={handleLine2Complete}
                    />
                  )}
                  {bubble1Lines.length > 2 && (
                    <TypeWritter
                      key="line-3"
                      text={bubble1Lines[2]}
                      speed={18}
                      style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}
                      onComplete={handleLine3Complete}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 3. BOT CHAT BUBBLE 2: Triển khai giải pháp ────────────── */}
        {activeBubbleIndex >= 2 && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-xs mt-0.5 select-none">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-md rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] flex flex-col gap-1.5 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-2-${replayKey}`}
                labels={['Booting…', 'Loading…', 'Preparing…', 'Initializing…']}
                icons={['✦', '◆', '✶', '❋', '✸']}
                duration={2200}
                showPercent={false}
                onComplete={handleBubble2LoaderComplete}
              />

              {bubble2Ready && (
                <div className="text-violet-700 font-semibold text-[12.5px] leading-relaxed pt-0.5 border-t border-slate-100">
                  Let's build something great 🚀 • Đã tối ưu pool kết nối
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. BOT CHAT BUBBLE 3: Kết quả nghiệm thu ───────────────── */}
        {activeBubbleIndex >= 3 && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-xs mt-0.5 select-none">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-md rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] flex flex-col gap-1.5 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-3-${replayKey}`}
                labels={['Syncing…', 'Configuring…', 'Setting up…', 'Onboarding…']}
                icons={['◈', '◉', '⬡', '⬢', '◍']}
                duration={2000}
                tokenTarget={0.8}
                showPercent={false}
                onComplete={handleBubble3LoaderComplete}
              />

              {bubble3Ready && (
                <div className="text-emerald-700 font-semibold text-[12.5px] leading-relaxed pt-0.5 border-t border-slate-100">
                  Ticket #SUP-8924 resolved • Hệ thống thanh toán đã khôi phục 99.8% ✅
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
