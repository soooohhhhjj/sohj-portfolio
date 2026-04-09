import { useEffect, useRef } from "react";

interface Props {
  src: string;
}

export default function BouncingImage({ src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const positionRef = useRef({ x: 20, y: 20 });
  const velocityRef = useRef({ x: 0.6, y: 0.6 });
  const boundsRef = useRef({ width: 0, height: 0, imgWidth: 0, imgHeight: 0 });

  useEffect(() => {
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const applyPosition = () => {
      const image = imgRef.current;
      if (!image) return;
      image.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0)`;
    };

    const syncBounds = () => {
      const container = containerRef.current;
      const image = imgRef.current;
      if (!container || !image) return;

      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();

      boundsRef.current = {
        width: containerRect.width,
        height: containerRect.height,
        imgWidth: imageRect.width,
        imgHeight: imageRect.height,
      };

      const maxX = Math.max(0, boundsRef.current.width - boundsRef.current.imgWidth);
      const maxY = Math.max(0, boundsRef.current.height - boundsRef.current.imgHeight);
      positionRef.current.x = Math.min(Math.max(positionRef.current.x, 0), maxX);
      positionRef.current.y = Math.min(Math.max(positionRef.current.y, 0), maxY);
      applyPosition();
    };

    const animate = () => {
      const { width, height, imgWidth, imgHeight } = boundsRef.current;
      const maxX = Math.max(0, width - imgWidth);
      const maxY = Math.max(0, height - imgHeight);

      let nextX = positionRef.current.x + velocityRef.current.x;
      let nextY = positionRef.current.y + velocityRef.current.y;

      if (nextX <= 0 || nextX >= maxX) {
        velocityRef.current.x *= -1;
        nextX = Math.min(Math.max(nextX, 0), maxX);
      }
      if (nextY <= 0 || nextY >= maxY) {
        velocityRef.current.y *= -1;
        nextY = Math.min(Math.max(nextY, 0), maxY);
      }

      positionRef.current.x = nextX;
      positionRef.current.y = nextY;
      applyPosition();

      frameId = requestAnimationFrame(animate);
    };

    const onImageReady = () => {
      syncBounds();
      if (!frameId) frameId = requestAnimationFrame(animate);
    };

    const image = imgRef.current;
    if (image) {
      if (image.complete) onImageReady();
      else image.addEventListener("load", onImageReady);
    }

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => syncBounds());
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (imgRef.current) resizeObserver.observe(imgRef.current);
    }

    const onWindowResize = () => syncBounds();
    window.addEventListener("resize", onWindowResize);

    return () => {
      if (image) image.removeEventListener("load", onImageReady);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <img
        ref={imgRef}
        src={src}
        draggable={false}
        className="
          absolute
          w-[90px]
          sm:w-[120px]
          md:w-[140px]
          lg:w-[110px]
          pointer-events-none
          filter
          drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]
        "
        style={{ left: 0, top: 0, transform: "translate3d(20px, 20px, 0)" }}
      />
    </div>
  );
}
