import { motion, type Easing } from 'framer-motion';
import { BugOff, GraduationCap, LaptopMinimalCheck, Layers } from 'lucide-react';
import clsx from 'clsx';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { BREAKPOINTS } from '../../../../shared/constants/breakpoints';

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

interface CardMotionWrapperProps {
  isSmAndBelow: boolean;
  shouldAnimate: boolean;
  duration: number;
  delay: number;
  className: string;
  children: ReactNode;
}

function CardMotionWrapper({
  isSmAndBelow,
  shouldAnimate,
  duration,
  delay,
  className,
  children,
}: CardMotionWrapperProps) {
  if (isSmAndBelow) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ y: '100vh' }}
      animate={{ y: shouldAnimate ? 0 : '100vh' }}
      transition={{ duration, ease: easeSmooth, delay }}
    >
      {children}
    </motion.div>
  );
}

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
        <div className="hero-card-split__icon-card w-[85px] min-w-[85px] xsm:w-[74px] xsm:min-w-[74px] p-4 sm:w-[78px] sm:min-w-[78px]">
          {/* Mobile split layout icon wrapper (rendered below md) */}
          <div className="w-10 h-10 hero-card-split__icon-wrap sm:w-10 sm:h-10">
            <Icon className="w-[22px] h-[22px] sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>

        <div className="gap-2 px-6 py-2 xsm:px-5 xsm:py-2 hero-card-split__content-card">
          <h3 className="hero-card-shell__title hero-card-shell__title--split font-bruno text-[11px] hero-card-title">
            {title}
          </h3>
          <div className="hero-card-shell__rule hero-card-shell__rule--active" />
          <p className="hero-card-shell__subtitle hero-card-shell__subtitle--split text-[11px] tracking-[.5px]">
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
  const [isSmAndBelow, setIsSmAndBelow] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= BREAKPOINTS.sm : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmAndBelow(window.innerWidth <= BREAKPOINTS.sm);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      <div className="mt-10 mb-7 md:mt-0 md:mb-5">
        <p className="font-bruno 
        text-[13px] sm:text-[15px] md:text-[12px] lg:text-[13px] 
        text-center md:text-start tracking-[1.3px] uppercase hero-card-section-title">
          Highlights
        </p>
      </div>

      <div className="flex flex-wrap gap-4 md:flex-nowrap sm:gap-6 md:gap-3 lg:gap-4">
        <CardMotionWrapper
          isSmAndBelow={isSmAndBelow}
          shouldAnimate={shouldAnimate}
          duration={1.35}
          delay={0.06}
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
        >
          <HeroCard
            index={0}
            Icon={GraduationCap}
            title="BSIT Graduate"
            subtitle="Bachelor of Science in Information Technology"
          />
        </CardMotionWrapper>

        <CardMotionWrapper
          isSmAndBelow={isSmAndBelow}
          shouldAnimate={shouldAnimate}
          duration={1.45}
          delay={0.07}
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
        >
          <HeroCard
            index={1}
            Icon={LaptopMinimalCheck}
            title="IT Intern Exp."
            subtitle="Technical support, system deployment & reporting"
          />
        </CardMotionWrapper>

        <CardMotionWrapper
          isSmAndBelow={isSmAndBelow}
          shouldAnimate={shouldAnimate}
          duration={1.55}
          delay={0.08}
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
        >
          <HeroCard
            index={2}
            Icon={Layers}
            title="SysArch Thesis"
            subtitle="Lead Developer - Inventory Management System"
          />
        </CardMotionWrapper>

        <CardMotionWrapper
          isSmAndBelow={isSmAndBelow}
          shouldAnimate={shouldAnimate}
          duration={1.65}
          delay={0.09}
          className="w-full md:w-[calc(25%-6px)] lg:w-[calc(25%-12px)]"
        >
          <HeroCard
            index={3}
            Icon={BugOff}
            title="Capstone Thesis"
            subtitle="Planning, debugging & feature support"
          />
        </CardMotionWrapper>
      </div>
    </motion.div>
  );
}
