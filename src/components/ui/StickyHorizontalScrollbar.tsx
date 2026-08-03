import { useEffect, useRef, useState, type RefObject } from "react";

interface Props {
  targetRef: RefObject<HTMLElement>;
}

/**
 * A sticky proxy scrollbar that mirrors horizontal scrolling of a wide table
 * so staff can scroll without reaching the bottom of the container.
 */
export const StickyHorizontalScrollbar = ({ targetRef }: Props) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const syncing = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    const bar = barRef.current;
    if (!target || !bar) return;

    const measure = () => setWidth(target.scrollWidth);
    measure();

    const onTarget = () => {
      if (syncing.current) return (syncing.current = false);
      syncing.current = true;
      bar.scrollLeft = target.scrollLeft;
    };
    const onBar = () => {
      if (syncing.current) return (syncing.current = false);
      syncing.current = true;
      target.scrollLeft = bar.scrollLeft;
    };

    target.addEventListener("scroll", onTarget);
    bar.addEventListener("scroll", onBar);
    const ro = new ResizeObserver(measure);
    ro.observe(target);

    return () => {
      target.removeEventListener("scroll", onTarget);
      bar.removeEventListener("scroll", onBar);
      ro.disconnect();
    };
  }, [targetRef]);

  if (!width) return null;

  return (
    <div ref={barRef} className="sticky bottom-0 z-10 overflow-x-auto bg-background/80 backdrop-blur-sm">
      <div style={{ width, height: 1 }} />
    </div>
  );
};

export default StickyHorizontalScrollbar;
