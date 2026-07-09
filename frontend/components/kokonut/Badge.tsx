import { type HTMLAttributes, type ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "soft" | "plum" | "outline";
}

const variants = {
  soft: "bg-lavender-100/80 text-plum-800 border border-lavender-200/60",
  plum: "bg-plum-900 text-cream border border-plum-700/40",
  outline:
    "bg-white/40 text-plum-800 border border-plum-700/20 backdrop-blur-sm",
};

/**
 * Kokonut Badge — pill-shaped label. Full radius (consistent with buttons).
 */
export function Badge({
  variant = "soft",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1
        text-xs font-medium tracking-wide ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
