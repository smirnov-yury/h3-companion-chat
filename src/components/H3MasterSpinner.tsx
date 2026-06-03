import React from "react";
import { resolveBranding } from "@/config/branding";

interface H3MasterSpinnerProps {
  /** Size in pixels (renders square). Default 48. */
  size?: number;
  /** Animation variant. "static" renders the mark with no animation (for brand display use). Default "rotate". */
  variant?: "rotate" | "pulse" | "draw" | "static";
  /** Tailwind classes (typically for color: e.g. "text-primary"). */
  className?: string;
  /** Accessible label for screen readers. Default "Loading". */
  ariaLabel?: string;
}

const STYLES = `
.h3ms-tri-rotate {
  transform-box: view-box;
  transform-origin: 512px 512px;
  animation: h3ms-spin 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.h3ms-tri-pulse { animation: h3ms-pulse 1.2s ease-in-out infinite; }
.h3ms-hex-draw {
  stroke-dasharray: 2600 2600;
  stroke-dashoffset: 2600;
  animation: h3ms-draw 2s ease-in-out infinite;
}
@keyframes h3ms-spin { to { transform: rotate(360deg); } }
@keyframes h3ms-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes h3ms-draw {
  0%   { stroke-dashoffset: 2600; }
  40%, 50%  { stroke-dashoffset: 0; }
  90%, 100% { stroke-dashoffset: -2600; }
}
@media (prefers-reduced-motion: reduce) {
  .h3ms-tri-rotate, .h3ms-tri-pulse, .h3ms-hex-draw {
    animation: none !important;
    stroke-dasharray: none;
    stroke-dashoffset: 0;
  }
}
`;

export default function H3MasterSpinner({
  size = 48,
  variant = "rotate",
  className = "",
  ariaLabel = "Loading",
}: H3MasterSpinnerProps) {
  const hexClass = variant === "draw" ? "h3ms-hex-draw" : "";
  const triClass =
    variant === "rotate" ? "h3ms-tri-rotate" : variant === "pulse" ? "h3ms-tri-pulse" : "";
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-block ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      <style>{STYLES}</style>
      <svg
        viewBox="0 0 1024 1024"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          className={hexClass}
          points="296,138 728,138 944,512 728,886 296,886 80,512"
          fill="none"
          stroke="currentColor"
          strokeWidth="69"
          strokeLinejoin="round"
        />
        <polygon className={triClass} points="443,408 443,616 616,512" fill="#E8B147" />
      </svg>
    </span>
  );
}
