import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bevelVariants = cva(
  "transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        // Khung dock kính mờ thanh thoát (chuẩn Action Dock Navbar)
        dock: "bg-gradient-to-b from-white/70 via-white/50 to-white/30 backdrop-blur-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.04)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
        
        // Nút bấm tương tác nổi khối (Light Theme)
        button: "bg-gradient-to-b from-white/85 via-white/65 to-white/45 backdrop-blur-md text-slate-800 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] hover:from-white hover:via-white/75 hover:to-white/55 active:scale-95 cursor-pointer flex items-center justify-center font-medium outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
        
        // Nút hoặc thanh tag/pill nhỏ gọn
        pill: "bg-gradient-to-b from-white/75 via-white/55 to-white/35 backdrop-blur-md shadow-[0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.03)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
        
        // Khung thẻ Card nổi khối 3D
        card: "bg-gradient-to-b from-white/90 via-white/75 to-white/60 backdrop-blur-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
        
        // Khung vỏ lớn bao toàn bộ section (Shell container)
        shell: "bg-gradient-to-b from-white/60 via-white/40 to-white/20 backdrop-blur-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",

        // Nút bấm chính màu cam nổi bật (Primary Action Bevel)
        primary: "bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] text-white shadow-[0_4px_16px_rgba(255,77,36,0.35),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center font-bold outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",

        // Phiên bản tối sang trọng (YouTube Dark Mode Bevel)
        dark: "bg-gradient-to-b from-neutral-800 via-neutral-850 to-neutral-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.4)] hover:from-neutral-750 hover:to-neutral-850 active:scale-95 cursor-pointer flex items-center justify-center font-medium outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
        
        // Khung rãnh trượt lõm sâu quang học 3D (Concave / Sunken Inset Bevel Track - Siêu mảnh & mềm)
        inset: "bg-slate-100/60 dark:bg-zinc-800/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none focus:outline-none focus-visible:outline-none",

        // Nút con trong Dock (hiện hiệu ứng quang học khi hover)
        subtle: "hover:bg-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)] text-[#555555] hover:text-[#FF4D24] bg-transparent cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none",

        // Nút bấm xanh dương nổi khối kèm vết ám ánh sáng rực rỡ (Chuẩn Upload Action từ ảnh Iconly)
        "glow-blue": "bg-gradient-to-b from-[#2E7DF8] via-[#1A73E8] to-[#0C60E8] text-white shadow-[0_10px_25px_-3px_rgba(26,115,232,0.5),0_4px_10px_-2px_rgba(26,115,232,0.32),inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-1.5px_1px_rgba(0,0,0,0.18)] hover:brightness-105 hover:shadow-[0_14px_30px_-3px_rgba(26,115,232,0.62),0_6px_14px_-2px_rgba(26,115,232,0.42)] active:scale-95 active:shadow-[0_6px_16px_-2px_rgba(26,115,232,0.42)] cursor-pointer flex items-center justify-center font-medium outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",

        // Đĩa tròn thả file ánh sáng xanh mềm (Chuẩn Dropzone Upload Disc từ ảnh Iconly)
        "glow-disc": "bg-gradient-to-b from-white via-[#F0F6FF] to-[#DBEBFF] text-[#1A73E8] shadow-[0_16px_36px_-6px_rgba(26,115,232,0.32),0_6px_16px_-2px_rgba(26,115,232,0.2),inset_0_2px_1.5px_rgba(255,255,255,1),inset_0_-2px_3px_rgba(26,115,232,0.08)] hover:shadow-[0_20px_42px_-6px_rgba(26,115,232,0.42),0_8px_20px_-2px_rgba(26,115,232,0.25)] hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",

        // Nút bấm sáng tinh tế nổi khối nhẹ (Chuẩn Cancel Button từ ảnh Iconly)
        "tactile-light": "bg-gradient-to-b from-white via-[#F8FAFC] to-[#EFF3F8] text-slate-800 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.06),0_2px_5px_-1px_rgba(15,23,42,0.04),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)] hover:from-white hover:to-[#F1F5F9] active:scale-95 cursor-pointer flex items-center justify-center font-medium outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",

        // Nút nổi FAB hình tròn (Chuẩn nút + thanh dock đáy)
        "glow-fab": "bg-gradient-to-b from-white via-[#FCFCFD] to-[#F1F4F8] text-slate-900 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.12),0_4px_8px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_14px_30px_-4px_rgba(15,23,42,0.16)] active:scale-95 cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
      },
      size: {
        default: "rounded-full",
        sm: "h-8 px-3 text-xs rounded-full",
        md: "h-11 px-4 text-sm rounded-full",
        lg: "h-12 px-6 text-base rounded-full",
        xl: "h-14 px-8 text-lg rounded-full",
        icon: "size-11 rounded-full p-0 flex items-center justify-center",
        disc: "size-20 rounded-full p-0 flex items-center justify-center",
        fab: "size-14 rounded-full p-0 flex items-center justify-center",
        card: "rounded-2xl p-4 sm:p-5",
        none: "",
      },
    },
    defaultVariants: {
      variant: "dock",
      size: "default",
    },
  }
)

export interface BevelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bevelVariants> {
  as?: React.ElementType
}

const Bevel = React.forwardRef<HTMLDivElement, BevelProps>(
  ({ className, variant, size, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(bevelVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Bevel.displayName = "Bevel"

export interface BevelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bevelVariants> {}

const BevelButton = React.forwardRef<HTMLButtonElement, BevelButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(bevelVariants({ variant: variant ?? "button", size: size ?? "md" }), className)}
        {...props}
      />
    )
  }
)
BevelButton.displayName = "BevelButton"

export interface BevelDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal"
}

const BevelDivider = React.forwardRef<HTMLDivElement, BevelDividerProps>(
  ({ className, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          orientation === "vertical"
            ? "w-[1px] h-5.5 bg-gradient-to-b from-white/80 via-slate-300/40 to-slate-400/20 mx-1 shrink-0"
            : "h-[1px] w-full bg-gradient-to-r from-white/80 via-slate-300/40 to-slate-400/20 my-1 shrink-0",
          className
        )}
        {...props}
      />
    )
  }
)
BevelDivider.displayName = "BevelDivider"

export { Bevel, BevelButton, BevelDivider, bevelVariants }
