import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

interface StickyHorizontalScrollbarProps {
  targetRef: RefObject<HTMLElement>;
}

/**
 * A sticky proxy horizontal scrollbar that mirrors the scrollLeft of `targetRef`.
 * Stays visible at the bottom of the surrounding scrollable region (via position: sticky)
 * so it behaves like the browser's native vertical scrollbar at the right edge of the viewport.
 */
export function StickyHorizontalScrollbar({ targetRef }: StickyHorizontalScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    visible: false,
    left: 0,
    width: 0,
    thumbWidthPct: 0,
    thumbLeftPct: 0,
  });
  const draggingRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const sync = () => {
      const { scrollLeft, scrollWidth, clientWidth } = target;
      const canScroll = scrollWidth > clientWidth;
      const rawThumbWidthPct = canScroll ? (clientWidth / scrollWidth) * 100 : 0;
      const thumbWidthPct = Math.min(Math.max(rawThumbWidthPct, 0), 100);
      const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
      const thumbLeftPct = maxScrollLeft === 0 ? 0 : (scrollLeft / maxScrollLeft) * (100 - thumbWidthPct);

      const rect = target.getBoundingClientRect();
      const left = Math.max(rect.left, 0);
      const right = Math.min(rect.right, window.innerWidth);
      const width = Math.max(right - left, 0);
      const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;

      setMetrics({
        visible: canScroll && inViewport && width > 0,
        left,
        width,
        thumbWidthPct,
        thumbLeftPct,
      });
    };

    sync();
    target.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(target);
    if (target.firstElementChild) ro.observe(target.firstElementChild);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      target.removeEventListener("scroll", sync);
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [targetRef]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = targetRef.current;
      const track = trackRef.current;
      const drag = draggingRef.current;
      if (!target || !track || !drag) return;
      const trackWidth = track.clientWidth;
      const dx = e.clientX - drag.startX;
      const ratio = target.scrollWidth / trackWidth;
      target.scrollLeft = drag.startScrollLeft + dx * ratio;
    };
    const onUp = () => {
      draggingRef.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [targetRef]);

  const onThumbDown = (e: React.PointerEvent) => {
    const target = targetRef.current;
    if (!target) return;
    e.preventDefault();
    draggingRef.current = { startX: e.clientX, startScrollLeft: target.scrollLeft };
    document.body.style.userSelect = "none";
  };

  const onTrackDown = (e: React.PointerEvent) => {
    const target = targetRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!target || !track || !thumb) return;
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = target.scrollWidth / track.clientWidth;
    const newScroll = clickX * ratio - target.clientWidth / 2;
    target.scrollLeft = Math.max(0, newScroll);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed bottom-0 z-40 px-2 py-1.5 bg-background/80 backdrop-blur-sm border-t border-border"
      style={{
        display: metrics.visible ? "block" : "none",
        left: `${metrics.left}px`,
        width: `${metrics.width}px`,
      }}
    >
      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        className="relative h-2.5 w-full rounded-full bg-muted cursor-pointer"
      >
        <div
          ref={thumbRef}
          onPointerDown={onThumbDown}
          className="absolute top-0 h-full rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing"
          style={{
            width: `${metrics.thumbWidthPct}%`,
            left: `${metrics.thumbLeftPct}%`,
            minWidth: "24px",
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
