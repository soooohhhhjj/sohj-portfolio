import { motion, type Easing } from 'framer-motion';
import { BugOff, GraduationCap, LaptopMinimalCheck, Layers } from 'lucide-react';
import clsx from 'clsx';
import { type ComponentType } from 'react';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface HeroCardsProps {
  shouldAnimate: boolean;
}

type HeroCardProps = {
  index: number;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
};

function HeroCard({
  index,
  Icon,
  title,
  subtitle,
}: HeroCardProps) {
  const isReversedOnMobile = index % 2 === 1;

  return (
    <>
      <div className={clsx('hero-card-split md:hidden', isReversedOnMobile && 'hero-card-split--reverse')}>
        <div className="p-3 hero-card-split__icon-card sm:p-4">
          {/* Mobile split layout icon wrapper (rendered below md) */}
          <div className="w-8 h-8 hero-card-split__icon-wrap sm:w-10 sm:h-10">
            <Icon className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>

        <div className="hero-card-split__content-card gap-1.5 p-3 sm:gap-2 sm:py-2 sm:px-5">
          <h3 className="hero-card-shell__title hero-card-shell__title--split font-bruno text-[12px] sm:text-[11px] hero-card-title">
            {title}
          </h3>
          <div className="hero-card-shell__rule hero-card-shell__rule--active" />
          <p className="hero-card-shell__subtitle hero-card-shell__subtitle--split text-[11.5px] sm:text-[10.5px]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="hero-card-shell hidden md:flex md:p-4 md:gap-2 lg:p-6 lg:gap-[10px]">
        <div className="hero-card-shell__border" />
        <div className="hero-card-shell__sheen" />
        <div className="hero-card-shell__hover-gradient" />
        <div className="hero-card-shell__corner-glint" />

        <div className="hero-card-shell__content">
          <div className="relative">
            <div className="hero-card-shell__icon-glow" />
            {/* Normal card layout icon wrapper (rendered from md and up) */}
            <div className="hero-card-shell__icon-wrap w-[40px] h-[40px] lg:w-[50px] lg:h-[50px]">
              <Icon className="w-[18px] h-[18px] lg:h-6 lg:w-6" />
            </div>
          </div>

          <div className="flex flex-col gap-2 hero-card-shell__title-block">
            <h3 className="hero-card-shell__title font-bruno text-[11px] lg:text-[14px] hero-card-title">{title}</h3>

            <div className="hero-card-shell__rule" />
          </div>
        </div>

        <p className="hero-card-shell__subtitle md:text-[10px] md:leading-snug lg:text-[12px] lg:leading-relaxed">
          {subtitle}
        </p>

        <div className="hero-card-shell__bottom-rule" />
      </div>
    </>
  );
}

export default function HeroCards({ shouldAnimate }: HeroCardsProps) {
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
      <div className="mt-10 mb-7 md:mb-5">
        <p className="font-bruno 
        text-[13px] sm:text-[15px] md:text-[12px] lg:text-[13px] 
        text-center md:text-start tracking-[1.3px] uppercase hero-card-section-title">
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
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
