"use client";
import { useEffect, useId, useRef } from "react";
export function SeedHeart({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      start = performance.now();
    const ease = (x: number) => {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    };
    const draw = (time: number) => {
      const t = ((time - start) / 1000) % 12;
      const inward = motion.matches
        ? 1
        : t <= 6
          ? ease(t / 6)
          : 1 - ease((t - 6) / 6);
      const radius = 39.65 - 21.65 * inward;
      svg.querySelectorAll("[data-petal]").forEach((el, i) => {
        el.setAttribute(
          "cx",
          String(50 + radius * Math.cos((i * Math.PI) / 3)),
        );
        el.setAttribute(
          "cy",
          String(50 + radius * Math.sin((i * Math.PI) / 3)),
        );
      });
      const reveal = ease((inward - 0.68) / 0.3);
      svg.querySelector("[data-clear]")?.setAttribute("r", String(21 * reveal));
      svg
        .querySelector("[data-heart]")
        ?.setAttribute("opacity", String(reveal));
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      start = performance.now();
      draw(start);
    };
    motion.addEventListener("change", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", update);
    };
  }, []);
  return (
    <svg
      ref={root}
      className={className}
      viewBox="-12 -12 124 124"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      role="img"
      aria-label="Gratitude Circles breathing heart"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <mask id={uid}>
          <rect
            x="-25"
            y="-25"
            width="150"
            height="150"
            fill="white"
            stroke="none"
          />
          <circle
            data-clear
            cx="50"
            cy="50"
            r="21"
            fill="black"
            stroke="none"
          />
        </mask>
      </defs>
      <g mask={`url(#${uid})`}>
        {Array.from({ length: 6 }, (_, i) => (
          <circle
            key={i}
            data-petal
            cx={50 + 18 * Math.cos((i * Math.PI) / 3)}
            cy={50 + 18 * Math.sin((i * Math.PI) / 3)}
            r="18"
          />
        ))}
      </g>
      <path
        data-heart
        d="M50 63 C45 59 36 53 36 46 C36 37 47 35 50 43 C53 35 64 37 64 46 C64 53 55 59 50 63Z"
      />
    </svg>
  );
}
