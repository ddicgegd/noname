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
    setCustomerStatus('sending');
    setUploadedFileName(undefined);
    setActiveBubbleIndex(-1);
    setBubble1Lines([]);
    setBubble2Ready(false);
    setBubble3Ready(false);

    const t1 = setTimeout(() => {
      setCustomerStatus('sent');
    }, 700);

    const t2 = setTimeout(() => {
      setActiveBubbleIndex(1);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replayKey]);

  // Handle external message from input
  useEffect(() => {
    if (!externalMessage) return;

    setCustomerText(externalMessage.text);
    setCustomerStatus('sending');
    setUploadedFileName(externalMessage.file);
    setActiveBubbleIndex(-1);
    setBubble1Lines([]);
    setBubble2Ready(false);
    setBubble3Ready(false);

    const t1 = setTimeout(() => {
      setCustomerStatus('sent');
    }, 600);

    const t2 = setTimeout(() => {
      setActiveBubbleIndex(1);
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [externalMessage]);

  // Sequence progression handlers
  const handleBubble1LoaderComplete = useCallback(() => {
    setBubble1Lines([
      '▸ [Phát hiện] Quá tải cổng thanh toán 2.4s trên cụm Redis replica-02',
    ]);
  }, []);

  const handleLine1Complete = useCallback(() => {
    setBubble1Lines((prev) => [
      ...prev,
      '✖ [Nguyên nhân] Cạn kiệt hàng đợi kết nối do 45.000 lượt thanh toán cùng lúc',
    ]);
  }, []);

  const handleLine2Complete = useCallback(() => {
    setBubble1Lines((prev) => [
      ...prev,
      '✔ [Tự động khắc phục] Tự động mở rộng hàng đợi & điều hướng sang cụm dự phòng',
    ]);
  }, []);

  const handleLine3Complete = useCallback(() => {
    const t = setTimeout(() => {
      setActiveBubbleIndex(2);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleBubble2LoaderComplete = useCallback(() => {
    setBubble2Ready(true);
    const t = setTimeout(() => {
      setActiveBubbleIndex(3);
    }, 900);
    return () => clearTimeout(t);
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white shrink-0 flex items-center justify-center shadow-xs text-[10.5px] font-bold select-none ring-1 ring-black/10">
            KH
          </div>
          <div className="flex flex-col items-end max-w-[85%]">
            <div className="bg-gradient-to-br from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-[0_4px_16px_rgba(255,77,36,0.22),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/20">
              {uploadedFileName && (
                <div className="flex items-center gap-1.5 mb-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-[11px] font-mono border border-white/10">
                  <span className="material-symbols-outlined text-[13px]">description</span>
                  <span className="truncate max-w-[140px] font-medium">{uploadedFileName}</span>
                </div>
              )}
              <p className="text-[13px] font-medium leading-relaxed tracking-tight">{customerText}</p>
            </div>

            {/* Sending status */}
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium pr-1 select-none font-mono">
              {customerStatus === 'sending' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Đang gửi…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[13px] text-emerald-600 font-bold">
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-[0_2px_8px_rgba(255,77,36,0.25)] mt-0.5 select-none ring-1 ring-white/30">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-xl rounded-2xl rounded-tl-xs px-4 py-3.5 border border-slate-200/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col gap-2.5 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-1-${replayKey}`}
                labels={['Đang quét…', 'Phân tích…', 'Chẩn đoán…', 'Kiểm tra…']}
                icons={['✦', '◆', '✶', '❋', '✸']}
                duration={2500}
                showPercent={true}
                onComplete={handleBubble1LoaderComplete}
              />

              {bubble1Lines.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                  <TypeWritter
                    key="line-1"
                    text={bubble1Lines[0]}
                    speed={18}
                    cursorColor="#FF4D24"
                    style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}
                    onComplete={handleLine1Complete}
                  />
                  {bubble1Lines.length > 1 && (
                    <TypeWritter
                      key="line-2"
                      text={bubble1Lines[1]}
                      speed={18}
                      cursorColor="#ef4444"
                      style={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}
                      onComplete={handleLine2Complete}
                    />
                  )}
                  {bubble1Lines.length > 2 && (
                    <TypeWritter
                      key="line-3"
                      text={bubble1Lines[2]}
                      speed={18}
                      cursorColor="#16a34a"
                      style={{ color: '#15803d', fontSize: 12, fontWeight: 700 }}
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-[0_2px_8px_rgba(255,77,36,0.25)] mt-0.5 select-none ring-1 ring-white/30">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-xl rounded-2xl rounded-tl-xs px-4 py-3.5 border border-slate-200/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col gap-2 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-2-${replayKey}`}
                labels={['Khởi động…', 'Đang nạp…', 'Chuẩn bị…', 'Khởi tạo…']}
                icons={['✦', '◆', '✶', '❋', '✸']}
                duration={2200}
                showPercent={false}
                onComplete={handleBubble2LoaderComplete}
              />

              {bubble2Ready && (
                <div className="text-slate-800 font-semibold text-[12px] leading-relaxed pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4D24]" />
                  <span>Đã tối ưu kết nối máy chủ • Phân tải sang 3 cụm dự phòng</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. BOT CHAT BUBBLE 3: Kết quả nghiệm thu ───────────────── */}
        {activeBubbleIndex >= 3 && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4D24] to-[#ff7a59] text-white shrink-0 flex items-center justify-center shadow-[0_2px_8px_rgba(255,77,36,0.25)] mt-0.5 select-none ring-1 ring-white/30">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>

            <div className="max-w-[88%] bg-white/95 backdrop-blur-xl rounded-2xl rounded-tl-xs px-4 py-3.5 border border-slate-200/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col gap-2 font-mono text-[12.5px]">
              <ShimmerLoader
                key={`loader-3-${replayKey}`}
                labels={['Đồng bộ…', 'Cấu hình…', 'Thiết lập…', 'Hoàn tất…']}
                icons={['◈', '◉', '⬡', '⬢', '◍']}
                duration={2000}
                showPercent={false}
                onComplete={handleBubble3LoaderComplete}
              />

              {bubble3Ready && (
                <div className="text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 px-3 py-2 rounded-xl font-semibold text-[12px] leading-relaxed pt-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600 font-bold shrink-0">
                    check_circle
                  </span>
                  <span>Yêu cầu #SUP-8924 đã giải quyết • Hệ thống thanh toán đã khôi phục 99.8%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
