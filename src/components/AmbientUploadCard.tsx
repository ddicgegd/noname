import React, { useState } from "react";
import { 
  Upload, 
  Video, 
  X, 
  Home, 
  Folder, 
  Plus, 
  Bell, 
  User, 
  ArrowRight,
  Sparkles,
  Check
} from "lucide-react";
import { AmbientBevelButton } from "./ui/AmbientBevelButton";

interface AmbientUploadCardProps {
  onUpload?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * AmbientUploadCard
 * Tái hiện 100% giao diện upload thẻ bài & bộ nút bấm nổi Bevel 3D kèm hiệu ứng ám ánh sáng (Ambient Light Glow)
 * dựa trên bản thiết kế gốc từ file ảnh Iconly.
 */
export function AmbientUploadCard({ onUpload, onCancel, className }: AmbientUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(62);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "files" | "add" | "alerts" | "account">("files");

  const handleUploadClick = () => {
    setIsUploading(true);
    if (onUpload) onUpload();
  };

  const handleCancelClick = () => {
    setIsUploading(false);
    if (onCancel) onCancel();
  };

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col items-center select-none ${className ?? ""}`}>
      {/* 1. Header Thương hiệu Iconly */}
      <div className="w-full flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          {/* Logo Iconly màu xanh */}
          <div className="size-6 rounded-lg bg-[#1A73E8] flex items-center justify-center shadow-[0_2px_8px_rgba(26,115,232,0.4)]">
            <div className="size-2.5 rounded-sm bg-white" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">iconly</span>
        </div>
        <span className="text-xs font-medium text-slate-400">Icon Set</span>
      </div>

      {/* 2. Thẻ Card Chính Neo-Tactile (Modern Skeuomorphic Upload Card) */}
      <div className="w-full bg-white/95 rounded-[32px] p-6 sm:p-7 border border-slate-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-5">
        
        {/* Khung thả file Dropzone với viền nét đứt (Dashed Area) */}
        <div className="w-full border-2 border-dashed border-slate-200/90 rounded-[24px] p-6 flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-b from-slate-50/40 to-transparent">
          <span className="text-sm font-semibold text-slate-800">Drop your video here</span>

          {/* ĐĨA TRÒN THẢ FILE ÁNH SÁNG XANH (Nút bấm tròn nổi Bevel kèm quầng ám ánh sáng xanh quang học) */}
          <div className="my-2">
            <AmbientBevelButton
              variant="glow-disc"
              size="disc"
              ambientHalo={true}
              haloColor="blue"
              onClick={handleUploadClick}
              aria-label="Upload video disc"
            >
              <Upload className="size-7 text-[#1A73E8] stroke-[2.2]" />
            </AmbientBevelButton>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400 max-w-[240px]">
            For best results, video uploads should be at least 1080p (1920 x 1080 pixels) in MP4 format.
          </p>
        </div>

        {/* Thẻ tiến trình tập tin đang tải (Class meeting MP4 Card) */}
        <div className="w-full bg-[#F4F7FB]/70 rounded-[20px] p-4 border border-slate-100/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon Video camera */}
              <div className="size-10 rounded-xl bg-gradient-to-b from-[#E8F1FD] to-[#D5E6FC] flex items-center justify-center text-[#1A73E8] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]">
                <Video className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800">Class meeting</span>
                <span className="text-[11px] text-slate-400">MP4 · 24 MB · 4 sec left</span>
              </div>
            </div>

            <button
              onClick={handleCancelClick}
              className="size-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              aria-label="Remove item"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Thanh Progress Bar xanh dương */}
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1A73E8] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(26,115,232,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* HÀNG 2 NÚT BẤM CHÍNH (Cancel vs Upload với hiệu ứng Bevel nổi khối và ám ánh sáng) */}
        <div className="w-full grid grid-cols-2 gap-3.5 pt-1">
          {/* Nút Cancel: Tactile Light Bevel Button */}
          <AmbientBevelButton
            variant="tactile-light"
            size="lg"
            className="w-full font-semibold text-sm"
            onClick={handleCancelClick}
          >
            Cancel
          </AmbientBevelButton>

          {/* Nút Upload: Glow Blue Bevel Button kèm Ám Ánh Sáng Xanh Rực Rỡ */}
          <AmbientBevelButton
            variant="glow-blue"
            size="lg"
            ambientHalo={true}
            haloColor="blue"
            className="w-full font-semibold text-sm"
            onClick={handleUploadClick}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 animate-spin" />
                Uploading...
              </span>
            ) : isCompleted ? (
              <span className="flex items-center gap-2">
                <Check className="size-4" />
                Done
              </span>
            ) : (
              "Upload"
            )}
          </AmbientBevelButton>
        </div>
      </div>

      {/* 3. Thanh Dock điều hướng đáy (Floating Dock with Center FAB Bevel Button) */}
      <div className="w-full max-w-[340px] mt-6 bg-[#F4F7FB]/90 backdrop-blur-md rounded-full px-4 py-2 border border-slate-200/70 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex items-center justify-between relative">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-0.5 px-2 transition-colors ${
            activeTab === "home" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="size-4" />
          <span className="text-[9px] font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`flex flex-col items-center gap-0.5 px-2 transition-colors ${
            activeTab === "files" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Folder className="size-4 fill-current" />
          <span className="text-[9px] font-medium">Files</span>
        </button>

        {/* Nút cộng FAB Nổi khối đặt nổi giữa thanh Dock (Center Elevated Bevel FAB) */}
        <div className="-mt-6">
          <AmbientBevelButton
            variant="glow-fab"
            size="fab"
            onClick={() => setActiveTab("add")}
            aria-label="Add new"
          >
            <Plus className="size-6 text-slate-900 stroke-[2.2]" />
          </AmbientBevelButton>
        </div>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-0.5 px-2 transition-colors ${
            activeTab === "alerts" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bell className="size-4" />
          <span className="text-[9px] font-medium">Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex flex-col items-center gap-0.5 px-2 transition-colors ${
            activeTab === "account" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="size-4" />
          <span className="text-[9px] font-medium">Account</span>
        </button>
      </div>

      {/* 4. Footer Iconly */}
      <div className="w-full flex items-center justify-between px-3 mt-6 text-xs text-slate-400">
        <span>iconly.pro</span>
        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
          <span>Swipe for More</span>
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </div>
  );
}
export default AmbientUploadCard;
