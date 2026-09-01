"use client";

import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  /** Change to re-trigger the enter animation */
  animationKey?: string;
  className?: string;
}

export default function FadeIn({
  children,
  animationKey,
  className = "",
}: FadeInProps) {
  return (
    <div
      key={animationKey}
      className={`animate-fade-in ${className}`.trim()}
    >
      {children}
    </div>
  );
}
