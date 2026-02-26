import { useEffect, useState } from 'react';
import { motion, type Easing } from 'framer-motion';
import { Download, Mail } from 'lucide-react';
import { Section, SectionContent } from '../../../shared/components/Container';
import { GlassCard } from '../../../shared/components/GlassCard';
import HeroCards from './hero/HeroCards';
import './hero/Hero.css';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface HeroProps {
  shouldAnimate: boolean;
  onAnimationsComplete: () => void;
  onContactClick?: () => void;
}

export function Hero({ shouldAnimate, onAnimationsComplete, onContactClick }: HeroProps) {
  const [outlineHover, setOutlineHover] = useState(false);
  const resumeUrl = `${import.meta.env.BASE_URL}sohj-resume.pdf`;

  useEffect(() => {
    if (!shouldAnimate) return;

    const totalHeroAnimationTime = 1600;

    const timer = setTimeout(() => {
      onAnimationsComplete();
    }, totalHeroAnimationTime);

    return () => {
      clearTimeout(timer);
    };
  }, [shouldAnimate, onAnimationsComplete]);

  return (
    <Section className="section-style relative z-10 mt-[20px] md:mt-[28px] lg:mt-[30px]">
      <SectionContent className="section-content responsiveness flex flex-col cursor-default">
        <div className="flex flex-col flex-1 gap-16 mt-[0px]">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-12 md:gap-8 lg:gap-12">
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: shouldAnimate ? 0 : '100vh' }}
              transition={{ duration: 0.8, ease: easeSmooth }}
            >
              <GlassCard
                width="max-w-full md:max-w-[272px] lg:max-w-[320px]"
                corner="rounded-[7px]"
                shadow="shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                className="overflow-hidden sm:max-h-[440px]"
              >
                <img
                  src={`${import.meta.env.BASE_URL}prof-pic.jpg`}
                  alt="Profile"
                  className="w-full h-full object-cover object-top"
                />
              </GlassCard>
            </motion.div>

            <div className="flex-1 max-w-[600px] text-center md:text-start mt-2">
              <motion.p
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 0.9, ease: easeSmooth, delay: 0.01 }}
                className="font-jura text-[15px] sm:text-[17px] md:text-[15px] lg:text-[18px] tracking-[.1px] sm:tracking-[.2px] text-white font-[700]"
              >
                Hi, I&apos;m <span>Carlo Joshua B. Abellera</span>, and I enjoy
              </motion.p>

              <motion.h2
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1, ease: easeSmooth, delay: 0.02 }}
                className="font-anta text-[38px] sm:text-[55px] md:text-[43px] lg:text-[58px] font-extrabold leading-tight tracking-tight inline-block mt-2"
              >
                <span className="hero-text">Building pixel-perfect</span>
                <br />
                <span className="hero-gradient-text">Interactive </span>
                <span className="hero-text">Websites</span>
              </motion.h2>

              <motion.p
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1.1, ease: easeSmooth, delay: 0.03 }}
                className="font-bruno text-[18px] sm:text-[22px] md:text-[18px] lg:text-[22px] font-[500] tracking-[1px] text-white mt-10 sm:mt-12 icon-role-text"
              >
                Full-Stack Developer
              </motion.p>

              <motion.div
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1.2, ease: easeSmooth, delay: 0.04 }}
                className="btn-pair flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 pt-6 sm:pt-7 text-[11px] sm:text-[12px] md:text-[11px] lg:text-[12px] tracking-[.2px] font-[700] font-jura"
              >
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hero-btn hero-btn-solid flex items-center gap-[4px] lg:gap-2 px-[14px] md:px-[15px] lg:px-5 py-[8px] md:py-[7px] lg:py-2 rounded-[4px] font-jura font-[700] tracking-[.2px] ${outlineHover ? 'btn-drain' : ''}`}
                >
                  <Download className="w-3 h-3 lg:w-[13px] lg:h-[13px]" />
                  Resume
                </a>

                <button
                  type="button"
                  className="hero-btn hero-btn-outline flex items-center gap-[4px] lg:gap-2 px-[14px] md:px-[15px] lg:px-5 py-[8px] md:py-[7px] lg:py-2 rounded-[4px] font-jura font-[700] tracking-[.2px]"
                  onClick={onContactClick}
                  onMouseEnter={() => setOutlineHover(true)}
                  onMouseLeave={() => setOutlineHover(false)}
                >
                  <Mail className="w-3 h-3 lg:w-[13px] lg:h-[13px]" />
                  Contact
                </button>
              </motion.div>
            </div>
          </div>

          <HeroCards shouldAnimate={shouldAnimate} />
        </div>
      </SectionContent>
    </Section>
  );
}
