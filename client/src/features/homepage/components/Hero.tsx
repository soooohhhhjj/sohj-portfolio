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
      <SectionContent className="flex flex-col cursor-default section-content responsiveness">
        <div className="flex flex-col flex-1 gap-16 mt-[0px]">
          <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-8 lg:gap-12">
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
                  className="object-cover object-top w-full h-full"
                />
              </GlassCard>
            </motion.div>

            <div className="flex-1 max-w-[600px] text-center md:text-start mt-2">
              <motion.p
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 0.9, ease: easeSmooth, delay: 0.01 }}
                className="font-jura hero-name-text text-[15px] sm:text-[17px] md:text-[15px] lg:text-[17px] tracking-[.3px] sm:tracking-[.5px] text-white font-[700]"
              >
                Hi, I&apos;m <span>Carlo Joshua B. Abellera</span>, and I enjoy
              </motion.p>

              <motion.h2
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1, ease: easeSmooth, delay: 0.02 }}
                className="font-anta text-[38px] text-[rgb(247,247,217)] sm:text-[55px] md:text-[43px] lg:text-[59.7px] font-extrabold leading-tight tracking-tight inline-block mt-2"
              >
                <span className="hero-big-text">Building pixel-perfect</span>
                <br />
                <span className="hero-big-text">Interactive</span>
                <span className="hero-big-text"> Websites</span>
              </motion.h2>

              <motion.p
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1.1, ease: easeSmooth, delay: 0.03 }}
                className="font-bruno text-[18px] sm:text-[22px] md:text-[18px] lg:text-[24px] font-[500] tracking-[1px] text-white mt-10 sm:mt-10 hero-role-text"
              >
                Full-Stack Developer
              </motion.p>

              <motion.div
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1.2, ease: easeSmooth, delay: 0.04 }}
                className="btn-pair flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 mt-6 sm:mt-7 text-[11px] sm:text-[12px] md:text-[11px] lg:text-[11px] tracking-[.2px] font-[700] font-jura"
              >
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hero-btn hero-btn-solid flex items-center gap-[4px] lg:gap-2 px-[14px] md:px-[15px] lg:px-[22px] py-[8px] md:py-[7px] lg:py-[7px] rounded-[4px] font-jura font-[700] tracking-[.2px] ${outlineHover ? 'btn-drain' : ''}`}
                >
                  <Download className="w-3 h-3 lg:w-[12px] lg:h-[12px]" />
                  Resume
                </a>

                <button
                  type="button"
                  className="hero-btn hero-btn-outline flex items-center gap-[4px] lg:gap-2 px-[14px] md:px-[15px] lg:px-[22px] py-[8px] md:py-[7px] lg:py-[7px] rounded-[4px] font-jura font-[700] tracking-[.2px]"
                  onClick={onContactClick}
                  onMouseEnter={() => setOutlineHover(true)}
                  onMouseLeave={() => setOutlineHover(false)}
                >
                  <Mail className="w-3 h-3 lg:w-[12px] lg:h-[12px]" />
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
