'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShimmerLoader } from '@/components/ui/shimmer-loader';
import { TypeWritter } from '@/components/ui/typing-writter';

export type Phase =
  | { type: 'divider' }
  | {
      type: 'bar';
      labels: string[];
      icons: string[];
      duration: number;
      tokenTarget?: number; // omit -> no token counter
      showPercent?: boolean; // default true
    }
  | { type: 'lines'; lines: string[] }
  | { type: 'message'; text: string; role?: 'customer' | 'assistant' | 'system' };

export interface IntroSequenceProps {
  key?: React.Key;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
  sequence?: Phase[];
  autoScroll?: boolean;
}

interface RenderedItem {
  id: string;
  phase: Phase;
  lineIndex?: number;
}

// ── divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{
        color: 'rgba(210,190,255,0.22)',
        fontSize: 12,
        letterSpacing: '2px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        margin: '2px 0',
      }}
    >
      {'─'.repeat(48)}
    </div>
  );
}

// ── default customer problem handling sequence ───────────────────────────────

export const DEFAULT_CUSTOMER_SEQUENCE: Phase[] = [
  {
    type: 'message',
    role: 'customer',
    text: '💬 Khách hàng: "Hệ thống checkout bị nghẽn thanh toán khi lượng truy cập tăng đột biến, tỷ lệ drop-off lên tới 35%. Cần giải pháp xử lý gấp!"',
  },
  { type: 'divider' },
  {
    type: 'bar',
    labels: [
      'Tiếp nhận yêu cầu sự cố #INC-8924…',
      'Phân tích log luồng checkout…',
      'Kiểm tra độ trễ DB & Payment Gateway…',
      'Xác định điểm nghẽn bottleneck…',
    ],
    icons: ['✦', '◆', '✶', '❋', '✸'],
    duration: 2600,
    tokenTarget: 0.8,
    showPercent: true,
  },
  {
    type: 'lines',
    lines: [
      '▸ Nguyên nhân: Lock contention bảng đơn hàng (Connection pool 100%)',
      '▸ Ảnh hưởng: 142 giao dịch chờ xử lý trong hàng đợi',
      '▸ Đề xuất: Phân tải qua Queue bất đồng bộ & kích hoạt Circuit Breaker',
    ],
  },
  { type: 'divider' },
  {
    type: 'bar',
    labels: [
      'Khởi tạo hàng đợi Redis/BullMQ…',
      'Mở rộng connection pool cơ sở dữ liệu…',
      'Áp dụng retry idempotent & fallback gateway…',
      'Chạy mô phỏng tải 5,000 req/s…',
    ],
    icons: ['◈', '◉', '⬡', '⬢', '◍'],
    duration: 2400,
    tokenTarget: 1.4,
    showPercent: false,
  },
  {
    type: 'message',
    role: 'assistant',
    text: '🚀 Trợ lý hỗ trợ: Đã xử lý phân luồng checkout qua Queue bất đồng bộ. Tỷ lệ thành công khôi phục 99.8%, độ trễ giảm còn 110ms.',
  },
  { type: 'divider' },
  {
    type: 'message',
    role: 'system',
    text: '✅ Hoàn tất hỗ trợ: Ticket #SUP-8924 đã đóng. Khách hàng xác nhận luồng mua sắm đã hoạt động trơn tru.',
  },
];

export function NewIntroSequence({
  onComplete,
  className,
  style,
  sequence = DEFAULT_CUSTOMER_SEQUENCE,
  autoScroll = true,
}: IntroSequenceProps) {
  const [items, setItems] = useState<RenderedItem[]>([]);
  const phaseRef = useRef(0);
  const lineRef = useRef(0);
  const completedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  const scrollToBottom = useCallback(() => {
    if (!autoScroll || !containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [autoScroll]);

  const advance = useCallback(() => {
    const currentSeq = sequenceRef.current;
    const phase = currentSeq[phaseRef.current];
    if (!phase) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    if (phase.type === 'divider') {
      setItems((prev) => [...prev, { id: `divider-${phaseRef.current}-${Date.now()}`, phase }]);
      phaseRef.current++;
      setTimeout(advance, 80);
      return;
    }

    if (phase.type === 'bar') {
      setItems((prev) => [...prev, { id: `bar-${phaseRef.current}-${Date.now()}`, phase }]);
      phaseRef.current++;
      return;
    }

    if (phase.type === 'lines') {
      lineRef.current = 0;
      phaseRef.current++;
      typeNextLine(phase.lines);
      return;
    }

    if (phase.type === 'message') {
      setItems((prev) => [...prev, { id: `msg-${phaseRef.current}-${Date.now()}`, phase }]);
      phaseRef.current++;
      setTimeout(advance, 380);
      return;
    }
  }, [onComplete]);

  const typeNextLine = useCallback(
    (lines: string[]) => {
      const idx = lineRef.current;
      if (idx >= lines.length) {
        setTimeout(advance, 200);
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          id: `line-${phaseRef.current - 1}-${idx}-${Date.now()}`,
          phase: { type: 'lines', lines },
          lineIndex: idx,
        },
      ]);
      lineRef.current++;
    },
    [advance]
  );

  // Restart sequence when sequence array changes
  useEffect(() => {
    setItems([]);
    phaseRef.current = 0;
    lineRef.current = 0;
    completedRef.current = false;

    const timer = setTimeout(() => {
      advance();
    }, 250);

    return () => clearTimeout(timer);
  }, [sequence, advance]);

  // Auto scroll on new items
  useEffect(() => {
    scrollToBottom();
  }, [items, scrollToBottom]);

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .custom-seq-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-seq-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-seq-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(192, 132, 252, 0.2);
          border-radius: 4px;
        }
        .custom-seq-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(192, 132, 252, 0.4);
        }
      `}</style>
      <div
        ref={containerRef}
        className={`custom-seq-scrollbar ${className || ''}`}
        style={{
          background: '#0d0c15',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          borderRadius: 14,
          border: '1px solid rgba(210,190,255,0.12)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4), 0 10px 30px -10px rgba(0,0,0,0.5)',
          minWidth: 0,
          width: '100%',
          overflowY: 'auto',
          maxHeight: 330,
          ...style,
        }}
      >
        {items.map((item) => {
          const { id, phase } = item;

          if (phase.type === 'divider') return <Divider key={id} />;

          if (phase.type === 'bar') {
            return (
              <ShimmerLoader
                key={id}
                labels={phase.labels}
                icons={phase.icons}
                duration={phase.duration}
                tokenTarget={phase.tokenTarget}
                showPercent={phase.showPercent}
                onComplete={() => {
                  setTimeout(advance, 150);
                }}
              />
            );
          }

          if (phase.type === 'lines' && item.lineIndex !== undefined) {
            const isLast = item.lineIndex === phase.lines.length - 1;
            return (
              <TypeWritter
                key={id}
                text={phase.lines[item.lineIndex]}
                onComplete={() => {
                  setTimeout(() => typeNextLine(phase.lines), isLast ? 0 : 180);
                }}
              />
            );
          }

          if (phase.type === 'message') {
            if (phase.role === 'customer') {
              return (
                <div
                  key={id}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#bae6fd',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    fontWeight: 500,
                  }}
                >
                  {phase.text}
                </div>
              );
            }

            if (phase.role === 'system') {
              return (
                <div
                  key={id}
                  style={{
                    background: 'rgba(52, 211, 153, 0.08)',
                    border: '1px solid rgba(52, 211, 153, 0.22)',
                    borderRadius: 8,
                    padding: '7px 11px',
                    color: '#6ee7b7',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {phase.text}
                </div>
              );
            }

            return (
              <div
                key={id}
                style={{
                  color: 'rgb(192,132,252)',
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.5,
                  paddingLeft: 4,
                  textShadow: '0 0 12px rgba(192,132,252,0.3)',
                }}
              >
                {phase.text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </>
  );
}
