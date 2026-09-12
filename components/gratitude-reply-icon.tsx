import type { SVGProps } from "react";

/** A returning gesture ending in a heart, distinct from the reaction heart. */
export function GratitudeReplyIcon({
  size = 22,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 4 3 9l5 5M3 9h9c4 0 7 2 7 5" />
      <path
        d="M18.5 21s-5-3.1-5-6a2.65 2.65 0 0 1 5-1.1 2.65 2.65 0 0 1 5 1.1c0 2.9-5 6-5 6Z"
        transform="translate(-1 -1) scale(.98)"
      />
    </svg>
  );
}
