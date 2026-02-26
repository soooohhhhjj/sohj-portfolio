import { motion, type Easing } from 'framer-motion';
import { BugOff, GraduationCap, LaptopMinimalCheck, Layers } from 'lucide-react';
import clsx from 'clsx';
import { useState, type ComponentType } from 'react';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface HeroCardsProps {
  shouldAnimate: boolean;
}

type HeroCardProps = {
  index: number;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  hoveredIndex: number | null;
  setHoveredIndex: (value: number | null) => void;
};

function HeroCard({
  index,
  Icon,
  title,
  subtitle,
  hoveredIndex,
  setHoveredIndex,
}: HeroCardProps) {
  const isHovered = hoveredIndex === index;

  return (
    <div
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      className={clsx('hero-card-shell', isHovered && 'hero-card-shell--hovered')}
    >
      <div className="hero-card-shell__border" />
      <div className="hero-card-shell__sheen" />
      <div className={clsx('hero-card-shell__hover-gradient', isHovered && 'hero-card-shell__hover-gradient--active')} />
      <div className={clsx('hero-card-shell__corner-glint', isHovered && 'hero-card-shell__corner-glint--active')} />

      <div className="hero-card-shell__content">
        <div className="relative">
          <div className={clsx('hero-card-shell__icon-glow', isHovered && 'hero-card-shell__icon-glow--active')} />
          <div className={clsx('hero-card-shell__icon-wrap', isHovered && 'hero-card-shell__icon-wrap--hovered')}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="hero-card-shell__title font-bruno text-[12px] sm:text-[14px] md:text-[14px] lg:text-[14px] text-white hero-card-title">
            {title}
          </h3>

          <div className={clsx('hero-card-shell__rule', isHovered && 'hero-card-shell__rule--active')} />
        </div>
      </div>

      <p className={clsx('hero-card-shell__subtitle', isHovered && 'hero-card-shell__subtitle--hovered')}>
        {subtitle}
      </p>

      <div className={clsx('hero-card-shell__bottom-rule', isHovered && 'hero-card-shell__bottom-rule--active')} />
    </div>
  );
}

export default function HeroCards({ shouldAnimate }: HeroCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ y: '100vh' }}
      animate={{ y: shouldAnimate ? 0 : '100vh' }}
      transition={{
        duration: 1.25,
        ease: easeSmooth,
        delay: 0.05,
      }}
      className="w-full responsiveness"
    >
      <div className="mb-5">
        <p className="font-bruno text-[13px] sm:text-[15px] md:text-[12px] lg:text-[13px] text-center md:text-start tracking-[1.3px] uppercase text-white hero-card-section-title">
          Highlights
        </p>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6">
        <motion.div
          className="w-full sm:w-[calc(50%-12px)] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
          initial={{ y: '100vh' }}
          animate={{ y: shouldAnimate ? 0 : '100vh' }}
          transition={{ duration: 1.35, ease: easeSmooth, delay: 0.06 }}
        >
          <HeroCard
            index={0}
            Icon={GraduationCap}
            title="BSIT Graduate"
            subtitle="Bachelor of Science in Information Technology"
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </motion.div>

        <motion.div
          className="w-full sm:w-[calc(50%-12px)] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
          initial={{ y: '100vh' }}
          animate={{ y: shouldAnimate ? 0 : '100vh' }}
          transition={{ duration: 1.45, ease: easeSmooth, delay: 0.07 }}
        >
          <HeroCard
            index={1}
            Icon={LaptopMinimalCheck}
            title="IT Internship"
            subtitle="Technical support, system deployment & reporting"
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </motion.div>

        <motion.div
          className="w-full sm:w-[calc(50%-12px)] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
          initial={{ y: '100vh' }}
          animate={{ y: shouldAnimate ? 0 : '100vh' }}
          transition={{ duration: 1.55, ease: easeSmooth, delay: 0.08 }}
        >
          <HeroCard
            index={2}
            Icon={Layers}
            title="SysArch Thesis"
            subtitle="Lead Developer - Inventory Management System"
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </motion.div>

        <motion.div
          className="w-full sm:w-[calc(50%-12px)] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
          initial={{ y: '100vh' }}
          animate={{ y: shouldAnimate ? 0 : '100vh' }}
          transition={{ duration: 1.65, ease: easeSmooth, delay: 0.09 }}
        >
          <HeroCard
            index={3}
            Icon={BugOff}
            title="Capstone Thesis"
            subtitle="Planning, debugging & feature support"
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
