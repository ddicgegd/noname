import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bevelVariants = cva(
  "transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        // Khung dock kính mờ thanh thoát (chuẩn Action Dock Navbar)
        dock: "bg-gradient-to-b from-white/70 via-white/50 to-white/30 border-t border-t-white/95 border-b border-b-slate-300/60 border-x border-x-white/60 backdrop-blur-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.04)]",
        
        // Nút bấm tương tác nổi khối (Light Theme)
        button: "bg-gradient-to-b from-white/85 via-white/65 to-white/45 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 backdrop-blur-md text-slate-800 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] hover:from-white hover:via-white/75 hover:to-white/55 active:scale-95 cursor-pointer flex items-center justify-center font-medium",
        
        // Nút hoặc thanh tag/pill nhỏ gọn
        pill: "bg-gradient-to-b from-white/75 via-white/55 to-white/35 border-t border-t-white/95 border-b border-b-slate-300/60 border-x border-x-white/60 backdrop-blur-md shadow-[0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.03)]",
        
        // Khung thẻ Card nổi khối 3D
        card: "bg-gradient-to-b from-white/90 via-white/75 to-white/60 border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 backdrop-blur-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.03)]",
        
        // Phiên bản tối sang trọng (YouTube Dark Mode Bevel)
        dark: "bg-gradient-to-b from-neutral-800 via-neutral-850 to-neutral-900 border-t border-t-neutral-700/80 border-b border-b-black/80 border-x border-x-neutral-800/60 text-white shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.4)] hover:from-neutral-750 hover:to-neutral-850 active:scale-95 cursor-pointer flex items-center justify-center font-medium",
        
        // Nút con trong Dock (hiện hiệu ứng quang học khi hover)
        subtle: "hover:bg-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.03)] text-[#555555] hover:text-[#FF4D24] bg-transparent cursor-pointer flex items-center justify-center",
      },
      size: {
        default: "rounded-full",
        sm: "h-8 px-3 text-xs rounded-full",
        md: "h-11 px-4 text-sm rounded-full",
        lg: "h-12 px-5 text-base rounded-full",
        icon: "size-11 rounded-full p-0 flex items-center justify-center",
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
