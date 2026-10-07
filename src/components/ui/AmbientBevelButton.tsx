import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Ambient Bevel Button Variants
 * Thiết kế chuẩn hiệu ứng nút bấm nổi Bevel 3D kèm vệt ám ánh sáng quang học (Ambient Light Cast)
 * lấy cảm hứng từ ngôn ngữ thiết kế Iconly / Skeuomorphic hiện đại.
 */
const ambientBevelVariants = cva(
  "relative inline-flex items-center justify-center font-medium select-none cursor-pointer outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // 1. Nút Action Xanh Dương chính (Chuẩn Upload Action từ ảnh Iconly)
        // Hiệu ứng Bevel: Viền sáng đỉnh + vệt ám ánh sáng xanh rực rỡ bên dưới
        "glow-blue":
          "bg-gradient-to-b from-[#2E7DF8] via-[#1A73E8] to-[#0C60E8] border-t border-t-white/40 border-b border-b-[#0747AD]/80 border-x border-x-[#1A73E8]/80 text-white shadow-[0_10px_25px_-3px_rgba(26,115,232,0.5),0_4px_10px_-2px_rgba(26,115,232,0.32),inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-1.5px_1px_rgba(0,0,0,0.18)] hover:brightness-105 hover:shadow-[0_14px_30px_-3px_rgba(26,115,232,0.62),0_6px_14px_-2px_rgba(26,115,232,0.42)] active:shadow-[0_6px_16px_-2px_rgba(26,115,232,0.42)] focus-visible:ring-blue-400",

        // 2. Đĩa tròn thả file ánh sáng xanh mềm (Chuẩn Dropzone Upload Disc từ ảnh Iconly)
        // Đĩa tròn gradient băng tuyết kết hợp quầng ám ánh sáng xanh lam dịu mắt
        "glow-disc":
          "bg-gradient-to-b from-white via-[#F0F6FF] to-[#DBEBFF] border-t border-t-white border-b border-b-blue-200/70 border-x border-x-blue-100/60 text-[#1A73E8] shadow-[0_16px_36px_-6px_rgba(26,115,232,0.34),0_6px_16px_-2px_rgba(26,115,232,0.2),inset_0_2px_1.5px_rgba(255,255,255,1),inset_0_-2px_3px_rgba(26,115,232,0.08)] hover:shadow-[0_20px_42px_-6px_rgba(26,115,232,0.45),0_8px_20px_-2px_rgba(26,115,232,0.25)] focus-visible:ring-blue-300",

        // 3. Nút bấm sáng tinh tế nổi khối nhẹ (Chuẩn Cancel Button từ ảnh Iconly)
        // Sứ mờ tinh khiết, viền nổi nhẹ nhàng, bóng đổ tiếp xúc êm ái
        "tactile-light":
          "bg-gradient-to-b from-white via-[#F8FAFC] to-[#EFF3F8] border-t border-t-white border-b border-b-slate-300/80 border-x border-x-slate-200/70 text-slate-800 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.06),0_2px_5px_-1px_rgba(15,23,42,0.04),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] hover:from-white hover:to-[#F1F5F9] focus-visible:ring-slate-400",

        // 4. Nút tròn FAB nổi khối (Chuẩn nút + thanh dock đáy)
        "glow-fab":
          "bg-gradient-to-b from-white via-[#FCFCFD] to-[#F1F4F8] border-t border-t-white border-b border-b-slate-200/90 border-x border-x-slate-100 text-slate-900 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.12),0_4px_8px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_14px_30px_-4px_rgba(15,23,42,0.16)] focus-visible:ring-slate-400",

        // 5. Nút Emerald lục bảo nổi khối kèm ám ánh sáng xanh lá
        "glow-emerald":
          "bg-gradient-to-b from-[#10B981] via-[#059669] to-[#047857] border-t border-t-white/40 border-b border-b-[#064E3B]/80 border-x border-x-[#059669]/80 text-white shadow-[0_10px_25px_-3px_rgba(5,150,105,0.48),0_4px_10px_-2px_rgba(5,150,105,0.3),inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-1.5px_1px_rgba(0,0,0,0.18)] hover:brightness-105 hover:shadow-[0_14px_30px_-3px_rgba(5,150,105,0.6),0_6px_14px_-2px_rgba(5,150,105,0.4)] focus-visible:ring-emerald-400",

        // 6. Nút Amber hoàng kim nổi khối kèm ám ánh sáng vàng cam
        "glow-amber":
          "bg-gradient-to-b from-[#F59E0B] via-[#D97706] to-[#B45309] border-t border-t-white/45 border-b border-b-[#78350F]/80 border-x border-x-[#D97706]/80 text-white shadow-[0_10px_25px_-3px_rgba(217,119,6,0.48),0_4px_10px_-2px_rgba(217,119,6,0.3),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-1.5px_1px_rgba(0,0,0,0.18)] hover:brightness-105 hover:shadow-[0_14px_30px_-3px_rgba(217,119,6,0.6),0_6px_14px_-2px_rgba(217,119,6,0.4)] focus-visible:ring-amber-400",

        // 7. Nút Purple tím huyền ảo nổi khối kèm ám ánh sáng tím
        "glow-violet":
          "bg-gradient-to-b from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] border-t border-t-white/40 border-b border-b-[#4C1D95]/80 border-x border-x-[#7C3AED]/80 text-white shadow-[0_10px_25px_-3px_rgba(124,58,237,0.48),0_4px_10px_-2px_rgba(124,58,237,0.3),inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-1.5px_1px_rgba(0,0,0,0.18)] hover:brightness-105 hover:shadow-[0_14px_30px_-3px_rgba(124,58,237,0.6),0_6px_14px_-2px_rgba(124,58,237,0.4)] focus-visible:ring-purple-400",
      },
      size: {
        sm: "h-8 px-3.5 text-xs rounded-full",
        md: "h-11 px-5 text-sm rounded-full",
        lg: "h-12 px-6 text-base rounded-full",
        xl: "h-14 px-8 text-lg rounded-full",
        icon: "size-11 rounded-full p-0 flex items-center justify-center",
        disc: "size-20 rounded-full p-0 flex items-center justify-center",
        fab: "size-14 rounded-full p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "glow-blue",
      size: "md",
    },
  }
);

export type AmbientBevelVariant = NonNullable<VariantProps<typeof ambientBevelVariants>["variant"]>;
export type AmbientBevelSize = NonNullable<VariantProps<typeof ambientBevelVariants>["size"]>;

export interface AmbientBevelButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "size"> {
  variant?: AmbientBevelVariant;
  size?: AmbientBevelSize;
  /**
   * Kích hoạt lớp khuếch tán ánh sáng nền phụ (Soft Radial Aura Halo)
   * Giúp hiệu ứng ám ánh sáng lan tỏa rộng và mềm mại hơn trên mặt phẳng phía sau.
   */
  ambientHalo?: boolean;
  /**
   * Màu tùy chỉnh của quầng sáng khuếch tán nếu kích hoạt ambientHalo
   */
  haloColor?: "blue" | "emerald" | "amber" | "violet" | "white";
}

const haloColorMap: Record<NonNullable<AmbientBevelButtonProps["haloColor"]>, string> = {
  blue: "bg-blue-500/25",
  emerald: "bg-emerald-500/25",
  amber: "bg-amber-500/25",
  violet: "bg-purple-500/25",
  white: "bg-white/40",
};

export const AmbientBevelButton = React.forwardRef<HTMLButtonElement, AmbientBevelButtonProps>(
  (
    {
      className,
      variant = "glow-blue",
      size = "md",
      ambientHalo = false,
      haloColor = "blue",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectedVariant = variant as AmbientBevelVariant;
    const selectedSize = size as AmbientBevelSize;

    return (
      <div className="relative inline-flex items-center justify-center">
        {/* Lớp quầng sáng ám ánh sáng mềm mại phía sau (Radial Ambient Glow Halo) */}
        {ambientHalo && !disabled && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-2.5 rounded-full blur-xl -z-10 pointer-events-none transition-opacity duration-300",
              haloColorMap[haloColor]
            )}
          />
        )}

        <motion.button
          ref={ref}
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.015, y: -0.5 }}
          whileTap={disabled ? undefined : { scale: 0.97, y: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className={cn(ambientBevelVariants({ variant: selectedVariant, size: selectedSize }), className)}
          {...props}
        >
          {children}
        </motion.button>
      </div>
    );
  }
);

AmbientBevelButton.displayName = "AmbientBevelButton";

export { ambientBevelVariants };
