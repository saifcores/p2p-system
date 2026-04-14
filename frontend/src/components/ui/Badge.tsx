import { clsx } from "clsx";
import type { ReactNode } from "react";

const variants: Record<string, string> = {
  default: "bg-white/10 text-slate-200 ring-1 ring-white/10",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  danger: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30",
  info: "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/25",
  muted: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        variants[variant],
        className,
      )}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  );
}
