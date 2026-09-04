"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AgentLoadingVariant = "drive" | "dots" | "orbit";

export type AgentLoadingStateProps = {
  /** 加载文案；默认“加载中”，调用方传入中文业务文案（如“正在搜索达人…”） */
  label?: string;
  /** 网格动效：drive 方块波前 / dots 圆点波前 / orbit 环绕 */
  variant?: AgentLoadingVariant;
  /** 是否显示耗时计时；默认显示 */
  showElapsed?: boolean;
  className?: string;
};

const GRID_CELLS = 9;

const CHEVRON_DELAYS: (number | null)[] = Array.from(
  { length: GRID_CELLS },
  (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    return (c + Math.abs(r - 1)) * 90;
  }
);

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const ORBIT_DELAYS: (number | null)[] = Array.from(
  { length: GRID_CELLS },
  (_, i) => {
    const k = ORBIT_ORDER.indexOf(i);
    return k === -1 ? null : k * 110;
  }
);

const PATTERNS: Record<
  AgentLoadingVariant,
  { delays: (number | null)[]; dur: number; round: boolean }
> = {
  drive: { delays: CHEVRON_DELAYS, dur: 650, round: false },
  dots: { delays: CHEVRON_DELAYS, dur: 650, round: true },
  orbit: { delays: ORBIT_DELAYS, dur: 950, round: false },
};

function LoaderGrid({
  delays,
  dur,
  round,
  frozen,
}: {
  delays: (number | null)[];
  dur: number;
  round: boolean;
  frozen: boolean;
}) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]"
    >
      {delays.map((delay, index) => (
        <span
          key={index}
          className={cn(
            "size-1 bg-foreground",
            round ? "rounded-full" : "rounded-[1px]"
          )}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animation:
              frozen || delay === null
                ? "none"
                : `ai-pixel-on ${dur}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function AgentLoadingState({
  label = "加载中",
  variant = "drive",
  showElapsed = true,
  className,
}: AgentLoadingStateProps) {
  const elapsed = useElapsed();
  const reducedMotion = useReducedMotion();
  const { delays, dur, round } = PATTERNS[variant];

  return (
    <div
      role="status"
      data-slot="ai-loading-state"
      className={cn("flex w-fit items-center gap-2.5", className)}
    >
      <LoaderGrid
        delays={delays}
        dur={dur}
        round={round}
        frozen={reducedMotion}
      />
      <span
        className="bg-clip-text font-medium text-[13px] text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)",
          backgroundSize: "200% 100%",
          animation: reducedMotion
            ? "none"
            : "ai-shimmer-text 1.4s linear infinite",
        }}
      >
        {label}
      </span>
      {showElapsed && (
        <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
          {elapsed}
        </span>
      )}
    </div>
  );
}
