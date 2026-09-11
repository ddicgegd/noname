import React, { useState } from "react";
import { MorphIcon, type MorphIconProps } from "morphicons/react";

export interface HoverMorphIconProps extends Omit<MorphIconProps, "icon"> {
  defaultIcon: any;
  hoverIcon?: any;
  isHovered?: boolean;
  spring?: "snappy" | "smooth" | "bouncy";
  className?: string;
  size?: number | string;
}

/**
 * HoverMorphIcon smoothly morphs from defaultIcon to hoverIcon when hovered,
 * either by self-hover or controlled parent container hover.
 */
export const HoverMorphIcon: React.FC<HoverMorphIconProps> = ({
  defaultIcon,
  hoverIcon,
  isHovered: controlledIsHovered,
  spring = "snappy",
  className = "",
  size = 16,
  ...rest
}) => {
  const [internalHovered, setInternalHovered] = useState(false);
  const activeHover = controlledIsHovered !== undefined ? controlledIsHovered : internalHovered;

  const currentIcon = activeHover && hoverIcon ? hoverIcon : defaultIcon;

  return (
    <MorphIcon
      icon={currentIcon}
      spring={spring}
      className={`select-none transition-transform duration-200 ${className}`}
      size={size}
      onMouseEnter={() => setInternalHovered(true)}
      onMouseLeave={() => setInternalHovered(false)}
      {...rest}
    />
  );
};
