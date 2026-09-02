import * as React from "react";
import { BevelButton } from "@/components/ui/bevel";
import { cn } from "@/lib/utils";

export interface VoucherCardProps extends React.HTMLAttributes<HTMLDivElement> {
  code?: string;
  discount?: string;
  discountLabel?: string;
  title?: string;
  description?: string;
  isCollected?: boolean;
  onClaim?: (e?: React.MouseEvent) => void;
  className?: string;
}

export function VoucherCard({
  code = "CLOUD5%",
  discount = "5%",
  discountLabel = "GIẢM",
  title = "Voucher 5% thành viên mới",
  description = "Tối đa 500K đơn đầu",
  isCollected = false,
  onClaim,
  className,
  ...props
}: VoucherCardProps) {
  return (
    <div className="relative select-none filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.065)] dark:drop-shadow-[0_3px_8px_rgba(0,0,0,0.32)]">
      {/* 3D Depth Shadow on bottom cutout arch (Reduced by 50% for subtle natural depth) */}
      <div
        className="absolute left-[53px] bottom-0 w-3.5 h-[7px] rounded-t-full shadow-[inset_0_2px_2.5px_rgba(0,0,0,0.16)] bg-transparent z-30 pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Bevel Light Rim on top cutout arch */}
      <div
        className="absolute left-[53px] top-0 w-3.5 h-[7px] rounded-b-full shadow-[inset_0_-1px_1.5px_rgba(255,255,255,0.45)] bg-transparent z-30 pointer-events-none"
        aria-hidden="true"
      />

      <div
        style={{
          mask: "radial-gradient(circle 6px at 60px 0, transparent 0 6px, #000 6.5px) top / 100% 51% no-repeat, radial-gradient(circle 6px at 60px 100%, transparent 0 6px, #000 6.5px) bottom / 100% 51% no-repeat",
          WebkitMask: "radial-gradient(circle 6px at 60px 0, transparent 0 6px, #000 6.5px) top / 100% 51% no-repeat, radial-gradient(circle 6px at 60px 100%, transparent 0 6px, #000 6.5px) bottom / 100% 51% no-repeat",
        }}
        className={cn(
          "group relative flex h-[58px] items-stretch rounded-xl border-t border-t-white/95 border-b border-b-slate-300/70 border-x border-x-white/70 bg-gradient-to-b from-white/95 via-white/85 to-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] dark:from-zinc-900/90 dark:to-zinc-950/80 dark:border-white/10 select-none overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Left Discount Bevel Stub */}
        <div className="relative flex w-[60px] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] text-white border-r border-dashed border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.2)]">
          {/* Left edge shine */}
          <div className="absolute inset-y-0 left-0 w-[1px] bg-white/40 pointer-events-none" />
          <span className="font-sans text-[8.5px] font-black uppercase tracking-wider text-white/90 leading-none">
            {discountLabel}
          </span>
          <span className="font-sans text-[15px] font-black tracking-tight leading-tight mt-0.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            {discount}
          </span>
        </div>

        {/* Right Content */}
        <div className="flex flex-1 items-center justify-between gap-2.5 pl-3.5 pr-3 py-1.5 min-w-0">
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-bold text-foreground text-[11px] sm:text-[11.5px] leading-tight truncate">
              {title}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 border border-border/60 text-[9px] font-mono font-bold text-muted-foreground tracking-wider uppercase leading-none">
                {code}
              </span>
              <span className="text-[9.5px] text-muted-foreground font-medium truncate">
                {description}
              </span>
            </div>
          </div>

          {/* Action Button with Tactile Bevel */}
          <BevelButton
            variant={isCollected ? "button" : "primary"}
            size="sm"
            onClick={onClaim}
            disabled={isCollected}
            className={`h-7 px-3 text-[10px] font-bold rounded-lg shrink-0 whitespace-nowrap leading-none cursor-pointer ${
              isCollected
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-none cursor-default"
                : "shadow-[0_2px_8px_rgba(255,77,36,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]"
            }`}
          >
            {isCollected ? (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                Đã lưu
              </span>
            ) : (
              "Lưu mã"
            )}
          </BevelButton>
        </div>
      </div>
    </div>
  );
}

export default VoucherCard;
