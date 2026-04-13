import { useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { FileText, Github, Linkedin, Mail } from 'lucide-react';
import { type ComponentType } from 'react';
import { Section, SectionContent } from '../../../shared/components/Container';
import { GlassCard } from '../../../shared/components/GlassCard';
import { HeroCards } from './HeroCards';
import './Hero.css';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];
const HERO_ANIMATION_TIME_MS = 1600;

interface HeroProps {
  shouldAnimate: boolean;
  onAnimationsComplete: () => void;
}

type HeroActionLink = {
  href: string;
  label: string;
  ariaLabel: string;
  Icon: ComponentType<{ className?: string }>;
  target?: '_blank';
  rel?: string;
};

export function Hero({ shouldAnimate, onAnimationsComplete }: HeroProps) {
  const resumeUrl = `${import.meta.env.BASE_URL}sohj-resume.pdf`;
  const heroActionLinks: HeroActionLink[] = [
    {
      href: resumeUrl,
      label: 'Resume',
      ariaLabel: 'Open resume',
      Icon: FileText,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      href: 'https://github.com/soooohhhhjj',
      label: 'GitHub',
      ariaLabel: 'Open GitHub profile',
      Icon: Github,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      href: 'http://linkedin.com/in/carlojoshua-abellera',
      label: 'LinkedIn',
      ariaLabel: 'Open LinkedIn profile',
      Icon: Linkedin,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      href: 'mailto:carlojoshua.abellera.ph@gmail.com',
      label: 'Email',
      ariaLabel: 'Send an email',
      Icon: Mail,
    },
  ];

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    const timer = window.setTimeout(() => {
      onAnimationsComplete();
    }, HERO_ANIMATION_TIME_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shouldAnimate, onAnimationsComplete]);

  return (
    <Section className="section-style relative z-10 mt-[30px] text-[rgb(247,247,217)]">
      <SectionContent className="flex cursor-default flex-col">
        <div className="mt-0 flex flex-1 flex-col gap-16">
          <div className="flex flex-col items-center justify-center 
                          gap-12 dinosaur:gap-6 md:gap-8 lg:gap-12
                          md:flex-row md:items-start">
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: shouldAnimate ? 0 : '100vh' }}
              transition={{ duration: 0.8, ease: easeSmooth }}
            >
              <GlassCard
                width="max-w-full md:max-w-[272px] lg:max-w-[320px]"
                corner="rounded-[7px]"
                shadow="shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                className="overflow-hidden 
                          dinosaur:max-h-[340px] xxsm:max-h-[380px] xsm:max-h-[470px] sm:max-h-[580px]"
              >
                <img
                  src={`${import.meta.env.BASE_URL}prof-pic.jpg`}
                  alt="Profile"
                  className="object-cover object-top w-full h-full"
                />
              </GlassCard>
            </motion.div>

            <div className="mt-2 max-w-[600px] flex-1 text-center md:text-start">
              <motion.p
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 0.9, ease: easeSmooth, delay: 0.01 }}
                className="hero-name-text font-jura font-[700] tracking-[.3px] 
                text-[12px] xxsm:text-[14px]  xsm:text-[16px] sm:text-[18px]  md:text-[15px] lg:text-[17px]
                xxsm:tracking-[.1px] sm:tracking-[.5px]"
              >
                Hi, I&apos;m <span>Carlo Joshua B. Abellera</span>, and I enjoy
              </motion.p>

              <motion.h2
                initial={{ y: '100vh' }}
                animate={{ y: shouldAnimate ? 0 : '100vh' }}
                transition={{ duration: 1, ease: easeSmooth, delay: 0.02 }}
                className="mt-2 inline-block font-anta font-extrabold leading-tight tracking-tight 
                text-[32px] xxsm:text-[38px] xsm:text-[46.7px] sm:text-[61px] md:text-[45px] lg:text-[59.7px]"
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
                className="hero-role-text mt-10 font-bruno font-[500] tracking-[1px] 
                text-[16px] xxsm:text-[18px] xsm:text-[22px] sm:mt-10 sm:text-[24px] md:text-[20px] lg:text-[24px]"
              >
                Full-Stack Developer
              </motion.p>

              <div
                className="hero-icon-links mt-6 sm:mt-7 
                [--hero-action-icon-size:21px] md:[--hero-action-icon-size:18px] lg:[--hero-action-icon-size:21px]"
              >
                {heroActionLinks.map(({ href, label, ariaLabel, Icon, target, rel }, index) => (
                  <motion.a
                    key={label}
                    href={href}
                    target={target}
                    rel={rel}
                    className="hero-icon-link"
                    aria-label={ariaLabel}
                    initial={{ y: '100vh' }}
                    animate={{ y: shouldAnimate ? 0 : '100vh' }}
                    transition={{
                      duration: 1.2,
                      ease: easeSmooth,
                      delay: 0.04 + index * 0.03,
                    }}
                  >
                    <Icon className="hero-icon-link__icon" />
                    <span className="hero-icon-link__label">{label}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <HeroCards shouldAnimate={shouldAnimate} />
        </div>
      </SectionContent>
    </Section>
  );
}
