import { useEffect, useRef, useState } from "react";

export const useContainerSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const nextWidth = Math.round(element.getBoundingClientRect().width);
      setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
};
