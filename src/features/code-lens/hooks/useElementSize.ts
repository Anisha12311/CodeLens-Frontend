import { RefObject, useEffect, useState } from 'react';

interface ElementSize {
  width: number;
  height: number;
}

/** The element's content size, kept current with a ResizeObserver. */
export function useElementSize(elementRef: RefObject<Element | null>, fallback: ElementSize) {
  const [size, setSize] = useState<ElementSize>(fallback);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize(current =>
        Math.round(current.width) === Math.round(width) &&
        Math.round(current.height) === Math.round(height)
          ? current
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);

  return size;
}
