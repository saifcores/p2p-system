import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const styles = {
  primary:
    "bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/10 hover:brightness-110",
  secondary: "bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
  danger:
    "bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/30 hover:bg-rose-500/30",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  leftIcon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles;
  size?: "sm" | "md";
  leftIcon?: ReactNode;
}) {
  const sizeCls = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        styles[variant],
        sizeCls,
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
}
