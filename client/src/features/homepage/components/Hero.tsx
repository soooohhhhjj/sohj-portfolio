import { useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { FileText, Github, Linkedin, Mail } from 'lucide-react';
import { Section, SectionContent } from '../../../shared/components/Container';
import { GlassCard } from '../../../shared/components/GlassCard';
import HeroCards from './hero/HeroCards';
import './hero/Hero.css';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface HeroProps {
  shouldAnimate: boolean;
  onAnimationsComplete: () => void;
}

export function Hero({ shouldAnimate, onAnimationsComplete }: HeroProps) {
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
    <Section className="section-style relative z-10 mt-[20px] md:mt-[28px] lg:mt-[30px] base-text-color">
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
                className="font-jura hero-name-text text-[15px] sm:text-[17px] md:text-[15px] lg:text-[17px] tracking-[.3px] sm:tracking-[.5px] font-[700]"
              >
                Hi, I&apos;m <span>Carlo Joshua B. Abellera</span>, and I enjoy
              </motion.p>

              <motion.h2
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1, ease: easeSmooth, delay: 0.02 }}
                className="font-anta text-[38px] sm:text-[55px] md:text-[43px] lg:text-[59.7px] font-extrabold leading-tight tracking-tight inline-block mt-2"
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
                className="font-bruno text-[18px] sm:text-[22px] md:text-[18px] lg:text-[24px] font-[500] tracking-[1px] mt-10 sm:mt-10 hero-role-text"
              >
                Full-Stack Developer
              </motion.p>

              <motion.div
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1.2, ease: easeSmooth, delay: 0.04 }}
                className="mt-6 hero-icon-links sm:mt-7"
              >
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-icon-link"
                  aria-label="Open resume"
                >
                  <FileText className="hero-icon-link__icon" />
                  <span className="hero-icon-link__label">Resume</span>
                </a>

                <a
                  href="https://github.com/soooohhhhjj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-icon-link"
                  aria-label="Open GitHub profile"
                >
                  <Github className="hero-icon-link__icon" />
                  <span className="hero-icon-link__label">GitHub</span>
                </a>

                <a
                  href="http://linkedin.com/in/carlojoshua-abellera"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-icon-link"
                  aria-label="Open LinkedIn profile"
                >
                  <Linkedin className="hero-icon-link__icon" />
                  <span className="hero-icon-link__label">LinkedIn</span>
                </a>

                <a
                  href="mailto:carlojoshua.abellera.ph@gmail.com"
                  className="hero-icon-link"
                  aria-label="Send an email"
                >
                  <Mail className="hero-icon-link__icon" />
                  <span className="hero-icon-link__label">Email</span>
                </a>
              </motion.div>
            </div>
          </div>

          <HeroCards shouldAnimate={shouldAnimate} />
        </div>
      </SectionContent>
    </Section>
  );
}
