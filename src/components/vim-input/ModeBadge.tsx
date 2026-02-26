import type { VimMode } from "./types";

type ModeBadgeProps = {
  mode: VimMode;
};

const STYLES_BY_MODE: Record<VimMode, string> = {
  insert: "bg-emerald-500/20 text-emerald-300 border-emerald-300/50",
  normal: "bg-sky-500/20 text-sky-300 border-sky-300/50",
  "visual-line": "bg-amber-500/20 text-amber-300 border-amber-300/50",
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const label = mode === "visual-line" ? "visual line" : mode;

  return (
    <span
      className={`rounded px-2 py-1 text-sm uppercase tracking-wider border ${STYLES_BY_MODE[mode]}`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
