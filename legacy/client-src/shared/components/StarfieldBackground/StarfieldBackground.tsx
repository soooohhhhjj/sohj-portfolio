import { useEffect, useRef } from 'react';
import { BREAKPOINTS } from '../../constants/breakpoints';
import { scrollVelocity } from '../../utils/scrollState';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface StarfieldBackgroundProps {
  mode?: StarMode;
}

const STAR_COUNTS = {
  mobile: [20, 6, 4],
  dinosaur: [24, 7, 5],
  xxsm: [28, 9, 6],
  xsm: [34, 11, 7],
  sm: [46, 15, 10],
  md: [90, 30, 22],
  lg: [120, 50, 25],
  xl: [120, 50, 25],
} as const;

const getStarCountsForWidth = (width: number): readonly [number, number, number] => {
  if (width >= BREAKPOINTS.xl) return STAR_COUNTS.xl;
  if (width >= BREAKPOINTS.lg) return STAR_COUNTS.lg;
  if (width >= BREAKPOINTS.md) return STAR_COUNTS.md;
  if (width >= BREAKPOINTS.sm) return STAR_COUNTS.sm;
  if (width >= BREAKPOINTS.xsm) return STAR_COUNTS.xsm;
  if (width >= BREAKPOINTS.xxsm) return STAR_COUNTS.xxsm;
  if (width >= BREAKPOINTS.dinosaur) return STAR_COUNTS.dinosaur;
  return STAR_COUNTS.mobile;
};

function generateStars(
  count: number,
  width: number,
  height: number,
  sizeRange: [number, number],
  speedRange: [number, number],
): Star[] {
  const stars: Star[] = [];

  for (let index = 0; index < count; index += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
      speed: Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0],
      opacity: Math.random() * 0.5 + 0.5,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }

  return stars;
}

export function StarfieldBackground({ mode = 'normal' }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<StarMode>(mode);
  const layersRef = useRef<{ stars: Star[]; speed: number }[]>([]);
  const viewportRef = useRef<{ width: number; height: number } | null>(null);
  const twinkleEnabledRef = useRef(true);
  const timeRef = useRef(0);
  const scrollInfluenceRef = useRef(0);
  const cinematicVelocityRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
    if (mode === 'cinematic') {
      cinematicVelocityRef.current = -12;
    }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    context.imageSmoothingEnabled = true;

    const createLayers = (width: number, height: number) => {
      const [slowCount, mediumCount, fastCount] = getStarCountsForWidth(width);
      layersRef.current = [
        {
          stars: generateStars(slowCount, width, height, [0.5, 0.8], [0.05, 0.15]),
          speed: 0.15,
        },
        {
          stars: generateStars(mediumCount, width, height, [0.8, 1.3], [0.1, 0.25]),
          speed: 0.3,
        },
        {
          stars: generateStars(fastCount, width, height, [1.3, 1.8], [0.3, 0.55]),
          speed: 0.6,
        },
      ];
    };

    const scaleLayersToViewport = (
      previousWidth: number,
      previousHeight: number,
      nextWidth: number,
      nextHeight: number,
    ) => {
      if (previousWidth <= 0 || previousHeight <= 0) return;

      const scaleX = nextWidth / previousWidth;
      const scaleY = nextHeight / previousHeight;

      layersRef.current.forEach(({ stars }) => {
        stars.forEach((star) => {
          star.x *= scaleX;
          star.y *= scaleY;

          if (star.x < 0) star.x = 0;
          if (star.x > nextWidth) star.x = nextWidth;
          if (star.y < 0) star.y = 0;
          if (star.y > nextHeight) star.y = nextHeight;
        });
      });
    };

    const resizeCanvas = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const previous = viewportRef.current;
      twinkleEnabledRef.current = nextWidth > BREAKPOINTS.sm;
      const isMobileViewport =
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        nextWidth < BREAKPOINTS.lg;

      if (!previous) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        createLayers(nextWidth, nextHeight);
        viewportRef.current = { width: nextWidth, height: nextHeight };
        return;
      }

      const widthDelta = Math.abs(nextWidth - previous.width);
      const heightDelta = Math.abs(nextHeight - previous.height);
      const orientationChanged = (previous.width > previous.height) !== (nextWidth > nextHeight);
      const isHeightOnlyResize = widthDelta <= 2 && heightDelta > 0;

      // Ignore mobile browser chrome height changes to avoid starfield "jump".
      if (isMobileViewport && isHeightOnlyResize && !orientationChanged) {
        return;
      }

      canvas.width = nextWidth;
      canvas.height = nextHeight;

      const shouldRegenerate = orientationChanged || widthDelta > 120;

      if (shouldRegenerate) {
        createLayers(nextWidth, nextHeight);
      } else {
        // Mobile address-bar collapse usually changes only height; keep stars and remap them.
        scaleLayersToViewport(previous.width, previous.height, nextWidth, nextHeight);
      }

      viewportRef.current = { width: nextWidth, height: nextHeight };
    };

    resizeCanvas();

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      timeRef.current += 0.016;
      scrollInfluenceRef.current += (scrollVelocity - scrollInfluenceRef.current) * 0.08;

      cinematicVelocityRef.current *= 0.98;
      if (Math.abs(cinematicVelocityRef.current) < 0.05) {
        cinematicVelocityRef.current = 0;
      }

      context.fillStyle = '#000000';
      context.fillRect(0, 0, width, height);

      layersRef.current.forEach(({ stars, speed }) => {
        stars.forEach((star) => {
          const twinkle = twinkleEnabledRef.current
            ? Math.sin(timeRef.current * star.twinkleSpeed + star.twinkleOffset) * 0.2 + 0.8
            : 1;

          context.fillStyle = `rgba(255,255,255,${star.opacity * twinkle})`;
          context.beginPath();
          context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          context.fill();

          let deltaX = -0.5 * speed;
          let deltaY = 0.5 * speed;

          if (modeRef.current === 'horizontal') {
            deltaX = -0.6 * speed;
            deltaY = 0;
          }

          if (modeRef.current === 'forward') {
            const vectorX = star.x - centerX;
            const vectorY = star.y - centerY;
            const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY) || 1;

            deltaX = (vectorX / distance) * speed * 0.02;
            deltaY = (vectorY / distance) * speed * 0.02;
          }

          if (
            Math.abs(scrollInfluenceRef.current) > 0.1 &&
            modeRef.current !== 'paused' &&
            modeRef.current !== 'cinematic' &&
            modeRef.current !== 'vertical'
          ) {
            deltaX = 0;
            deltaY = -scrollInfluenceRef.current * speed * 0.6;
          }

          if (modeRef.current === 'paused') {
            deltaX = 0;
            deltaY = 0;
          } else if (modeRef.current === 'vertical') {
            deltaX = 0;
            deltaY = -10 * speed;
          } else if (modeRef.current === 'cinematic') {
            deltaX = 0;
            deltaY = cinematicVelocityRef.current * speed;
          }

          star.x += deltaX;
          star.y += deltaY;

          const outOfBounds = star.x < 0 || star.x > width || star.y < 0 || star.y > height;

          if (outOfBounds) {
            if (modeRef.current === 'forward') {
              star.x = Math.random() * width;
              star.y = Math.random() * height;
            } else {
              if (star.x < 0) star.x = width;
              if (star.x > width) star.x = 0;
              if (star.y < 0) star.y = height;
              if (star.y > height) star.y = 0;
            }
          }
        });
      });
    };

    animate();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />;
}
