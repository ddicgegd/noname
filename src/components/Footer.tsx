import React from "react";
import { Mail, Phone, MapPin, Globe, ShieldCheck, Facebook, Github, Linkedin, Youtube } from "lucide-react";

export default function Footer({ onNavigate }: { onNavigate?: (page: "landing" | "product" | "register" | "auth-report") => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-app-footer" className="w-full bg-[#E4E4E4] border-t border-slate-300/60 mt-auto select-none py-8">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col gap-6 font-sans">
        
        {/* Upper Row: Brand & Simple Navigation & Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.("landing")}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-500 to-[#FF4D24] flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white">
                  <animate attributeName="r" values="3.5;5;3.5" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="12" r="7.5" stroke="white" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.7">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="7s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="0.8" strokeDasharray="8 12" opacity="0.45">
                  <animateTransform attributeName="transform" type="rotate" from="360 12 12" to="0 12 12" dur="11s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="4.5" r="1.2" fill="white" />
                <circle cx="5.5" cy="15.8" r="1.2" fill="white" />
                <circle cx="18.5" cy="15.8" r="1.2" fill="white" />
              </svg>
            </div>
            <span className="font-sans font-black text-sm text-[#111111] tracking-tight">
              SYNAPSE<span className="text-[#FF4D24]">DIGITAL</span>
            </span>
          </div>

          {/* Quick inline navigation links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-600 font-semibold">
            <button onClick={() => onNavigate?.("landing")} className="hover:text-[#FF4D24] transition-colors duration-200 cursor-pointer">
              Trang chủ
            </button>
            <button onClick={() => onNavigate?.("product")} className="hover:text-[#FF4D24] transition-colors duration-200 cursor-pointer">
              Sản phẩm chính hãng
            </button>
            <button onClick={() => onNavigate?.("auth-report")} className="hover:text-[#FF4D24] transition-colors duration-200 cursor-pointer">
              Báo cáo Xác thực
            </button>
            <a href="#sla" className="hover:text-[#FF4D24] transition-colors duration-200">
              Cam kết dịch vụ
            </a>
            <a href="#privacy" className="hover:text-[#FF4D24] transition-colors duration-200">
              Bảo mật
            </a>
            <a href="#contact" className="hover:text-[#FF4D24] transition-colors duration-200">
              Liên hệ
            </a>
          </div>

          {/* Social Channels */}
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-300/40 text-slate-500 hover:text-[#FF4D24] transition-all duration-300">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-300/40 text-slate-500 hover:text-[#FF4D24] transition-all duration-300">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-300/40 text-slate-500 hover:text-[#FF4D24] transition-all duration-300">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-300/40 text-slate-500 hover:text-[#FF4D24] transition-all duration-300">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Separator line */}
        <hr className="border-slate-300/60" />

        {/* Lower Row: Company details & Copyright */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Company contact and registration details */}
          <div className="md:col-span-8 flex flex-col gap-1 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 text-[11.5px] uppercase tracking-wide">
              Hệ thống Bán lẻ Thiết bị Công nghệ Synapse Digital Việt Nam
            </span>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <span>ĐKKD: 0109283746 - cấp ngày 15/08/2022 bởi Sở KH&ĐT TP.HCM.</span>
              <span>Hotline: 1900 6789</span>
              <span>Email: support@synapsedigital.vn</span>
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF4D24] shrink-0" />
              <span>Bitexco Financial Tower, Q.1, TP. Hồ Chí Minh.</span>
            </p>
          </div>

          {/* Ministry badge & Copyright */}
          <div className="md:col-span-4 flex flex-col md:items-end justify-center gap-2">
            {/* Ministry of Industry and Trade (Bộ Công Thương) Registry Badge */}
            <a 
              href="http://online.gov.vn/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-teal-200/50 bg-teal-50/20 hover:bg-teal-50/40 transition-colors duration-200 h-[32px] select-none text-left cursor-pointer w-fit"
            >
              <div className="w-4 h-4 shrink-0 rounded-full bg-teal-600 flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[8px] text-teal-800 font-extrabold tracking-wider">ĐÃ ĐĂNG KÝ</span>
                <span className="text-[7px] text-teal-600 font-bold">BỘ CÔNG THƯƠNG</span>
              </div>
            </a>

            <div className="text-[10px] text-slate-500 md:text-right">
              &copy; {currentYear} Synapse Digital. All rights reserved.
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
