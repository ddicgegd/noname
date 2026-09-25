/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { TraditionalCustomerChat } from "./TraditionalCustomerChat";
import nexusAiImg from "../assets/images/nexus_ai_banner_1783513292577.jpg";
import aeroGpuImg from "../assets/images/aero_gpu_banner_1783513312133.jpg";

interface AttachedItem {
  id: string;
  url: string;
  name: string;
  file?: File;
  isImage: boolean;
}

export default function FeatureOne() {
  const [replayKey, setReplayKey] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [externalMessage, setExternalMessage] = useState<{ text: string; file?: string } | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedItem[]>([
    {
      id: "demo-img-1",
      url: nexusAiImg,
      name: "checkout_error_spike.png",
      isImage: true,
    },
    {
      id: "demo-img-2",
      url: aeroGpuImg,
      name: "server_dropoff_latency.png",
      isImage: true,
    },
  ]);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [isStackHovered, setIsStackHovered] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverLeaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStackMouseEnter = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setIsStackHovered(true);
  };

  const handleStackMouseLeave = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsStackHovered(false);
      setHoveredImageId(null);
    }, 200); // Hold 0.2s khi di chuột ra
  };

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!lightboxUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxUrl(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      const currentImagesCount = attachedFiles.filter((f) => f.isImage).length;
      const availableImageSlots = Math.max(0, 3 - currentImagesCount);

      const newItems: AttachedItem[] = [];
      let imagesAdded = 0;

      for (let idx = 0; idx < filesArray.length; idx++) {
        const file = filesArray[idx];
        const isImg = file.type.startsWith("image/");
        if (isImg) {
          if (imagesAdded < availableImageSlots) {
            imagesAdded++;
            newItems.push({
              id: `${file.name}-${Date.now()}-${idx}`,
              url: URL.createObjectURL(file),
              name: file.name,
              file,
              isImage: true,
            });
          }
        } else {
          newItems.push({
            id: `${file.name}-${Date.now()}-${idx}`,
            url: URL.createObjectURL(file),
            name: file.name,
            file,
            isImage: false,
          });
        }
      }
      setAttachedFiles((prev) => [...prev, ...newItems]);
    }
    e.target.value = "";
  };

  const handleRemoveAttached = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSendMessage = () => {
    const textToSend = inputValue.trim();
    if (!textToSend && attachedFiles.length === 0) return;

    setExternalMessage({
      text:
        textToSend ||
        (attachedFiles.length > 0
          ? `Đã đính kèm ${attachedFiles.length} hình ảnh sự cố.`
          : ""),
      file:
        attachedFiles.length > 0
          ? attachedFiles.map((f) => f.name).join(", ")
          : undefined,
    });
    setInputValue("");
    setAttachedFiles([]);
  };

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
    setExternalMessage(null);
    setAttachedFiles([
      {
        id: "demo-img-1",
        url: nexusAiImg,
        name: "checkout_error_spike.png",
        isImage: true,
      },
      {
        id: "demo-img-2",
        url: aeroGpuImg,
        name: "server_dropoff_latency.png",
        isImage: true,
      },
    ]);
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
      <div className="w-[85%] 2xl:max-w-[1800px] mx-auto bg-gradient-to-b from-white/70 via-white/50 to-white/30 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl rounded-[26px] shadow-[0_16px_44px_-10px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden">
        
        {/* FIRST FEATURE: Trao đổi & xử lý vấn đề khách hàng */}
        <div className="flex flex-col md:flex-row min-h-[596px]">
          {/* Left Side: Copywriting */}
          <div className="p-8 sm:p-12 w-full md:w-1/2 flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D24]/10 border border-[#FF4D24]/20 text-[#FF4D24] font-mono text-[11px] font-bold tracking-widest uppercase mb-4 w-fit select-none">
              01 / 04
            </div>
            <h3 className="font-display text-3xl sm:text-4xl text-slate-900 font-bold mb-5 leading-tight tracking-tight">
              Trao đổi & xử lý vấn đề khách hàng
            </h3>
            <p className="font-sans text-base sm:text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
              Tự động phân tích yêu cầu, chẩn đoán nguyên nhân gốc rễ và xử lý sự cố trực tiếp với khách hàng qua luồng tương tác và báo cáo kỹ thuật thông minh.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <a
                href="#pricing"
                onClick={handleScrollToPricing}
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-b from-white/95 via-white/85 to-white/70 border-t border-t-white border-b border-b-slate-300/80 border-x border-x-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] backdrop-blur-md text-slate-900 hover:text-white hover:bg-gradient-to-b hover:from-[#FF5E3A] hover:via-[#FF4D24] hover:to-[#E03A12] hover:border-[#FF4D24] hover:shadow-[0_4px_16px_rgba(255,77,36,0.35)] font-semibold text-[15px] px-8 py-4 rounded-[14px] w-fit transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer select-none"
              >
                <span>Bắt đầu trải nghiệm</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>

            {/* Feature Highlights Pills */}
            <div className="mt-8 pt-6 border-t border-black/5 flex flex-wrap gap-2.5 select-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs text-slate-700 font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#FF4D24]">bolt</span>
                <span>Chẩn đoán &lt; 500ms</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs text-slate-700 font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#FF4D24]">shield</span>
                <span>Tự động sửa lỗi</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs text-slate-700 font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#FF4D24]">sync</span>
                <span>Đồng bộ đa kênh</span>
              </div>
            </div>
          </div>

          {/* Right Side: Chat Mockup Box */}
          <div className="w-full md:w-1/2 bg-white/20 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 border-t md:border-t-0 md:border-l border-white/40 min-h-[450px]">
            {/* Deep glowing background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D24]/10 via-white/50 to-[#326578]/10" />
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[#FF4D24]/20 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
              <div className="absolute bottom-0 left-0 w-[60%] h-[80%] bg-[#326578]/20 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
            </div>

            {/* Glowing Glass Chat Card */}
            <div className="relative z-10 w-[92%] max-w-xl min-h-[470px] bg-gradient-to-b from-white/95 via-white/80 to-white/65 backdrop-blur-[32px] rounded-2xl border-t border-t-white border-x border-x-white/70 border-b border-b-slate-300/60 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col overflow-hidden">

              {/* Chat Frame Body */}
              <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden relative">
                {/* Scroll Area with Clean View */}
                <div className="relative flex-1 min-h-[290px] max-h-[385px] flex flex-col overflow-hidden">
                  <TraditionalCustomerChat
                    key={`chat-${replayKey}`}
                    replayKey={replayKey}
                    externalMessage={externalMessage}
                    className="flex-1"
                  />
                  {/* Subtle top fade */}
                  <div className="pointer-events-none absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white/40 via-white/15 to-transparent z-10" />
                  {/* Subtle bottom fade */}
                  <div className="pointer-events-none absolute bottom-0 inset-x-0 h-3.5 bg-gradient-to-t from-white/40 via-white/15 to-transparent z-10" />
                </div>

                {/* Chat Input Area */}
                <div className="mt-auto relative">
                  {/* Absolute Floating Attachment Preview */}
                  <div className="absolute bottom-full inset-x-0 mb-[6px] z-30 pointer-events-auto flex flex-col select-none">
                    {/* File preview: Non-image documents */}
                    <AnimatePresence>
                      {attachedFiles.filter((f) => !f.isImage).length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-1.5 justify-start pl-2">
                          {attachedFiles
                            .filter((f) => !f.isImage)
                            .map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-1.5 bg-gradient-to-b from-white/95 via-white/85 to-white/75 backdrop-blur-md rounded-full px-2.5 py-1 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 ring-1 ring-black/[0.06] shadow-[0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] text-xs"
                              >
                                <span className="material-symbols-outlined text-primary text-[14px]">
                                  description
                                </span>
                                <span className="text-xs text-[#111111] font-medium truncate max-w-[130px]">
                                  {item.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveAttached(item.id, e)}
                                  className="w-4 h-4 rounded-full hover:bg-black/5 flex items-center justify-center ml-0.5 text-[#666666] hover:text-[#111111] cursor-pointer transition-colors"
                                >
                                  <svg
                                    className="w-2.5 h-2.5"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                                  </svg>
                                </button>
                              </motion.div>
                            ))}
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Image Stack Preview (tối đa 3 ảnh):
                        - Luôn cố định gốc bên trái (pl-2) ngay trên nút đính kèm, Card 0 đứng yên không bao giờ bị trượt làm người dùng phải với chuột theo
                        - Hoạt ảnh throw ra siêu nhanh và mượt mà (stiffness 400, damping 30, mass 0.6)
                        - Hold 0.2s khi rời chuột
                    */}
                    <AnimatePresence>
                      {attachedFiles.filter((f) => f.isImage).length > 0 && (
                        <div className="w-full flex justify-start pl-2">
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onMouseEnter={handleStackMouseEnter}
                            onMouseLeave={handleStackMouseLeave}
                            className="flex items-center pointer-events-auto select-none w-fit"
                          >
                            {attachedFiles
                              .filter((f) => f.isImage)
                              .slice(0, 3)
                              .map((item, index, arr) => {
                                const isHovered = hoveredImageId === item.id;
                                // Tính toán độ rộng và độ đè tối ưu theo số lượng ảnh (1, 2 hoặc 3)
                                const cardWidth =
                                  arr.length === 1
                                    ? "w-[175px]"
                                    : arr.length === 2
                                    ? "w-[160px]"
                                    : "w-[145px]";
                                const restingMargin =
                                  arr.length === 1
                                    ? 0
                                    : arr.length === 2
                                    ? -115
                                    : -103;
                                const hoveredMargin = 6;
                                const overlapMarginLeft =
                                  index === 0
                                    ? 0
                                    : isStackHovered
                                    ? hoveredMargin
                                    : restingMargin;
                                const cardZIndex = isHovered ? 30 : 10 + index;

                                return (
                                  <motion.div
                                    key={item.id}
                                    onMouseEnter={() => {
                                      setHoveredImageId(item.id);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredImageId((curr) =>
                                        curr === item.id ? null : curr
                                      );
                                    }}
                                    animate={{
                                      marginLeft: overlapMarginLeft,
                                      y: isHovered ? -2 : 0,
                                      scale: isHovered ? 1.015 : 1,
                                    }}
                                    style={{
                                      zIndex: cardZIndex,
                                    }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 30,
                                      mass: 0.6,
                                      delay: isStackHovered ? index * 0.015 : 0,
                                    }}
                                    className={`relative ${cardWidth} h-[36px] shrink-0 backdrop-blur-md rounded-full px-2 py-1 transition-[background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 cursor-pointer ${
                                      isHovered
                                        ? "bg-white border-t border-t-white border-b border-b-slate-300/80 border-x border-x-white/80 ring-1 ring-black/[0.08] shadow-[0_4px_14px_-2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)]"
                                        : "bg-gradient-to-b from-white/95 via-white/85 to-white/75 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 ring-1 ring-black/[0.06] shadow-[0_2px_8px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
                                    }`}
                                  >
                                  {/* Thumbnail Image: click to enlarge */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxUrl(item.url);
                                    }}
                                    title="Xem ảnh lớn"
                                    className="w-5 h-5 rounded-full shrink-0 overflow-hidden bg-black/5 border border-black/10 hover:scale-105 transition-transform cursor-zoom-in"
                                  >
                                    <img
                                      src={item.url}
                                      alt={item.name}
                                      className="w-full h-full object-cover select-none pointer-events-none"
                                    />
                                  </div>

                                  {/* File Name */}
                                  <span
                                    onClick={() => setLightboxUrl(item.url)}
                                    className="text-xs text-[#111111] font-medium truncate flex-1 leading-none select-none"
                                  >
                                    {item.name}
                                  </span>

                                  {/* Close / Remove Button */}
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleRemoveAttached(item.id, e)
                                    }
                                    title="Xóa ảnh này"
                                    className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center shrink-0 text-[#666666] hover:text-[#111111] cursor-pointer transition-colors"
                                  >
                                    <svg
                                      className="w-2.5 h-2.5"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.75"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                                    </svg>
                                  </button>
                                </motion.div>
                              );
                            })}
                                </motion.div>
                              </div>
                            )}
                      </AnimatePresence>
                    </div>

                {/* Hidden off-screen measurement span to measure exact pixel width of single-line text */}
                {/* Unified Search-Bar Style Input Bar */}
                  <div
                    ref={containerRef}
                    onClick={() => inputRef.current?.focus()}
                    className="h-[46px] bg-gradient-to-b from-white/95 via-white/85 to-white/70 backdrop-blur-xl rounded-full border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex items-center px-1.5 gap-1 relative z-20 pointer-events-auto cursor-text focus-within:ring-1 focus-within:ring-primary/25 transition-shadow"
                  >
                    {/* Action tool: Attach button on left */}
                    <label
                      className={`relative w-[36px] h-[36px] shrink-0 rounded-full flex items-center justify-center transition-colors cursor-pointer pointer-events-auto ${
                        attachedFiles.length > 0
                          ? "text-primary bg-primary/10"
                          : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                      }`}
                      title="Đính kèm tệp hoặc ảnh"
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <span className="material-symbols-outlined text-[19px] leading-none select-none">
                        attach_file
                      </span>
                      {attachedFiles.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
                          {attachedFiles.length}
                        </span>
                      )}
                    </label>

                    {/* Main Input Field - exactly like search bar in Navbar.tsx */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Mô tả sự cố hoặc nội dung cần hỗ trợ..."
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      className="w-full h-full bg-transparent border-none outline-none text-[15px] sm:text-[16px] text-slate-900 placeholder:text-slate-400 font-medium tracking-tight leading-none placeholder:font-normal placeholder:text-[14px] sm:placeholder:text-[15px] caret-[#FF4D24] selection:bg-[#FF4D24]/20 selection:text-[#FF4D24] pl-0.5 pr-2 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />

                    {/* Send Button on right */}
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() && attachedFiles.length === 0}
                      title="Gửi vấn đề để kích hoạt luồng xử lý"
                      className="w-[36px] h-[36px] rounded-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] border-t border-t-white/50 border-b border-b-[#A8280A] shadow-[0_2px_8px_rgba(255,77,36,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed pointer-events-auto shrink-0 transition-transform"
                    >
                      <span className="material-symbols-outlined text-white text-[17px]">
                        arrow_upward
                      </span>
                    </button>
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D24]/10 border border-[#FF4D24]/20 text-[#FF4D24] font-mono text-[11px] font-bold tracking-widest uppercase mb-4 w-fit select-none">
              02 / 04
            </div>
            <h3 className="font-display text-3xl sm:text-4xl text-slate-900 font-bold mb-5 leading-tight tracking-tight">
              Hạ tầng Backend cho SaaS
            </h3>
            <p className="font-sans text-base sm:text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
              Hạ tầng mạnh mẽ được sinh tự động ngay tức thì. Từ xác thực bảo mật đến mô hình cơ sở dữ liệu, hệ thống tự động xử lý toàn bộ backend để bạn tập trung phát triển trải nghiệm.
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
                      Triển khai hệ thống
                    </span>
                    <span className="text-black/50 text-[10px] font-bold uppercase tracking-widest block mt-1 font-mono">
                      v1.2.0-ổn định
                    </span>
                  </div>
                </div>

                {/* Sparkline Graph */}
                <div className="flex flex-col items-end gap-1 select-none">
                  <div className="text-[10px] font-bold text-[#555555] uppercase tracking-tighter">
                    Độ ổn định
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
                      <span className="text-black">Runtime máy chủ Edge</span>
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
                      <span>Chứng chỉ bảo mật SSL đang kích hoạt</span>
                    </div>
                    <span className="font-mono opacity-60">12:45:01</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555555] text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] font-bold text-[#27C93F]">
                        storage
                      </span>
                      <span>Đồng bộ cơ sở dữ liệu 100%</span>
                    </div>
                    <span className="font-mono opacity-60">12:45:03</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555555] text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <span>Phân phối CDN toàn cầu...</span>
                    </div>
                    <span className="font-mono opacity-60">Đang chạy</span>
                  </div>
                </div>

                {/* Bottom Live Banner with Bevel Pill */}
                <div className="mt-4 p-3 bg-gradient-to-b from-white/95 via-white/85 to-white/70 rounded-xl border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#27C93F] text-[18px] font-bold">
                      check_circle
                    </span>
                    <span className="text-black text-[12px] font-bold">
                      Đang vận hành thực tế
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

      {/* Lightbox Enlarged Preview Modal (Portaled to document.body to always center in viewport) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {lightboxUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxUrl(null)}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm cursor-zoom-out select-none"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900/95 cursor-default flex items-center justify-center"
                >
                  <img
                    src={lightboxUrl}
                    alt="Enlarged view"
                    className="w-full h-full max-h-[80vh] object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    title="Đóng xem trước (Esc)"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors shadow-md z-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
}
