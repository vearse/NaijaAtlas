"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** How long each card holds the slot before rotating to the next. */
export const CORNER_ROTATE_MS = 15_000;

/** Cross-fade duration; must be <= the CSS duration-* on the wrapper. */
const FADE_MS = 700;

export interface CornerCard {
  key: string;
  node: ReactNode;
  /** Lets a card opt out when it has nothing to show (empty legend, no data). */
  visible?: boolean;
}

interface MapCornerSlotProps {
  cards: CornerCard[];
  intervalMs?: number;
  className?: string;
}

/**
 * Single bottom-right slot on the map that rotates between cards.
 *
 * The outgoing card is kept mounted (absolutely positioned over the incoming
 * one) for the length of the fade, so cards cross-fade instead of blinking.
 * Rotation pauses while the pointer is over the slot or focus is inside it.
 */
export default function MapCornerSlot({
  cards,
  intervalMs = CORNER_ROTATE_MS,
  className = "",
}: MapCornerSlotProps) {
  const shown = cards.filter((c) => c.visible !== false);
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);

  // Keep the index in range when the card set shrinks or reorders.
  useEffect(() => {
    setActive((a) => (shown.length === 0 ? 0 : a % shown.length));
  }, [shown.length]);

  useEffect(() => {
    if (shown.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setOutgoing(active);
      setActive((a) => (a + 1) % shown.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, shown.length, intervalMs, paused]);

  useEffect(() => {
    if (outgoing == null) return;
    const id = window.setTimeout(() => setOutgoing(null), FADE_MS);
    return () => window.clearTimeout(id);
  }, [outgoing]);

  const onFocusCapture = useCallback(() => setPaused(true), []);
  const onBlurCapture = useCallback(
    (e: React.FocusEvent) => {
      if (!slotRef.current?.contains(e.relatedTarget as Node | null)) {
        setPaused(false);
      }
    },
    []
  );

  if (shown.length === 0) return null;

  const render = (index: number) => {
    if (index === active) {
      return (
        <div key={`${shown[index].key}-in`} className="relative animate-fade-in-soft">
          {shown[index].node}
        </div>
      );
    }
    if (index === outgoing) {
      return (
        <div
          key={`${shown[index].key}-out`}
          className="absolute inset-0 pointer-events-none animate-fade-out"
        >
          {shown[index].node}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={slotRef}
      className={`absolute bottom-3 right-3 lg:bottom-20 z-10 w-[240px] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
    >
      {shown.map((_, i) => render(i))}
    </div>
  );
}
