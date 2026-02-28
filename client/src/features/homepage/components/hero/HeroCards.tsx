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
  const isReversedOnMobile = index % 2 === 1;

  return (
    <>
      <div className={clsx('hero-card-split md:hidden', isReversedOnMobile && 'hero-card-split--reverse')}>
        <div className="hero-card-split__icon-card">
          <div className="hero-card-split__icon-wrap">
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="hero-card-split__content-card">
          <h3 className="hero-card-shell__title hero-card-shell__title--split font-bruno text-[12px] hero-card-title">
            {title}
          </h3>
          <div className="hero-card-shell__rule hero-card-shell__rule--active" />
          <p className="hero-card-shell__subtitle hero-card-shell__subtitle--split">{subtitle}</p>
        </div>
      </div>

      <div
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        className={clsx('hero-card-shell hidden md:flex md:p-4 md:gap-2 lg:p-6 lg:gap-[10px]', isHovered && 'hero-card-shell--hovered')}
      >
        <div className="hero-card-shell__border" />
        <div className="hero-card-shell__sheen" />
        <div className={clsx('hero-card-shell__hover-gradient', isHovered && 'hero-card-shell__hover-gradient--active')} />
        <div className={clsx('hero-card-shell__corner-glint', isHovered && 'hero-card-shell__corner-glint--active')} />

        <div className="hero-card-shell__content">
          <div className="relative">
            <div className={clsx('hero-card-shell__icon-glow', isHovered && 'hero-card-shell__icon-glow--active')} />
            <div className={clsx('hero-card-shell__icon-wrap', isHovered && 'hero-card-shell__icon-wrap--hovered')}>
              <Icon className="w-[18px] h-[18px] lg:h-6 lg:w-6" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="hero-card-shell__title font-bruno text-[12px] lg:text-[14px] hero-card-title">{title}</h3>

            <div className={clsx('hero-card-shell__rule', isHovered && 'hero-card-shell__rule--active')} />
          </div>
        </div>

        <p
          className={clsx(
            'hero-card-shell__subtitle md:text-[11px] md:leading-snug lg:text-[12px] lg:leading-relaxed',
            isHovered && 'hero-card-shell__subtitle--hovered',
          )}
        >
          {subtitle}
        </p>

        <div className={clsx('hero-card-shell__bottom-rule', isHovered && 'hero-card-shell__bottom-rule--active')} />
      </div>
    </>
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
        <p className="font-bruno text-[13px] sm:text-[15px] md:text-[12px] lg:text-[13px] text-center md:text-start tracking-[1.3px] uppercase hero-card-section-title">
          Highlights
        </p>
      </div>

      <div className="flex flex-wrap gap-4 md:flex-nowrap sm:gap-6 md:gap-3 lg:gap-4">
        <motion.div
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
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
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
          initial={{ y: '100vh' }}
          animate={{ y: shouldAnimate ? 0 : '100vh' }}
          transition={{ duration: 1.45, ease: easeSmooth, delay: 0.07 }}
        >
          <HeroCard
            index={1}
            Icon={LaptopMinimalCheck}
            title="IT Intern Exp."
            subtitle="Technical support, system deployment & reporting"
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </motion.div>

        <motion.div
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
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
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
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
