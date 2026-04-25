"use client";

import { type ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  /** How many copies of the children to render (for seamless loop). Default 4. */
  repeat?: number;
  className?: string;
  durationSeconds?: number;
  pauseOnHover?: boolean;
}

/**
 * Pure-CSS infinite marquee. Lightweight; pauses on hover.
 * Place items as siblings inside <Marquee>...</Marquee>.
 */
export function Marquee({
  children,
  repeat = 4,
  className = "",
  durationSeconds = 40,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={`marquee ${className}`}
      style={{ ["--duration" as never]: `${durationSeconds}s` }}
      onMouseEnter={(e) => {
        if (!pauseOnHover) return;
        const t = e.currentTarget.querySelector(".marquee-track") as HTMLElement | null;
        if (t) t.style.animationPlayState = "paused";
      }}
      onMouseLeave={(e) => {
        if (!pauseOnHover) return;
        const t = e.currentTarget.querySelector(".marquee-track") as HTMLElement | null;
        if (t) t.style.animationPlayState = "running";
      }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div className="marquee-track" key={i} aria-hidden={i > 0}>
          {children}
        </div>
      ))}
    </div>
  );
}
