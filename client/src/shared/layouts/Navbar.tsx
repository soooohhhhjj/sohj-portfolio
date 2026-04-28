import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { HireModal } from '../components/OverlayModal/HireModal';
import './navbar.css';

interface NavbarProps {
  mode?: 'default' | 'home';
  shouldAnimate?: boolean;
}

export function Navbar({ mode = 'home', shouldAnimate = true }: NavbarProps) {
  const shouldRender = mode !== 'home' || shouldAnimate;
  const [runFlicker, setRunFlicker] = useState(false);
  const [isHireLetterOpen, setIsHireLetterOpen] = useState(false);

  useEffect(() => {
    if (mode !== 'home' || !shouldAnimate) {
      return;
    }
    const timer = window.setTimeout(() => setRunFlicker(true), 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [mode, shouldAnimate]);

  const motionProps = useMemo(() => {
    if (mode !== 'home') {
      return {
        initial: { y: 0, opacity: 1 },
        animate: { y: 0, opacity: 1 },
      };
    }
    return {
      initial: { y: '100vh' },
      animate: { y: shouldAnimate ? 0 : '100vh' },
    };
  }, [mode, shouldAnimate]);

  if (!shouldRender) {
    return null;
  }

  return (
    <header className="relative z-40">
      <div className="responsiveness">
        <motion.nav
          initial={motionProps.initial}
          animate={motionProps.animate}
          transition={{ duration: 0.6, ease: [0.12, 0.7, 0.63, 0.9] }}
          className="relative z-40 mt-[30px] flex w-full items-end justify-between md:mt-[32px] lg:mt-[30px]"
        >
          <h1
            className="icon-text font-bruno text-[17px] font-[500] tracking-[2px] text-[rgb(247,247,217)] xxsm:text-[20px] sm:text-[24px] md:text-[18px] lg:text-[20px]"
          >
            {'sohj.abe'.split('').map((char, index) => (
              <span
                key={index}
                className={`char-${index} ${runFlicker ? 'flicker-once' : ''}`}
              >
                {char}
              </span>
            ))}
          </h1>

          <button
            type="button"
            className={`hire-status-trigger mb-[7px] flex items-center gap-2 text-[#7df7b6] ${isHireLetterOpen ? 'is-open' : ''}`}
            onClick={() => setIsHireLetterOpen(true)}
          >
            <span className="hire-status-dot" aria-hidden="true" />
            <span className="hire-status-text font-jura text-[11px] leading-[1] tracking-[0.08em]">
              Available for hire
            </span>
          </button>

          {/* <div className="nav-links hidden gap-6 lg:flex">
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('home-top')}
            >
              Home
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('projects-section')}
            >
              Projects
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('about-section')}
            >
              About Me
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('contact-section')}
            >
              Contact
            </button>
          </div> */}

          {/* <button
            type="button"
            className="hamburger inline-flex lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </button> */}
        </motion.nav>

        {/* <div className="nav-mobile flex flex-col lg:hidden">
          <div className="nav-links flex flex-col items-start gap-4 pt-4">
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('home-top')}
            >
              Home
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('projects-section')}
            >
              Projects
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('about-section')}
            >
              About Me
            </button>
            <button
              type="button"
              className="nav-link nav-link-size border-0 bg-transparent p-0"
              onClick={() => scrollToSection('contact-section')}
            >
              Contact
            </button>
          </div>
        </div> */}
      </div>

      <HireModal
        isOpen={isHireLetterOpen}
        onClose={() => setIsHireLetterOpen(false)}
      >
        <div className="font-medium text-[var(--base-text-color)]">
          <p>Heelllooo! :)</p>

          <p className="mt-6">
            My name is Josh, and I&apos;m a fresh graduate looking to start my career.
            I&apos;m particularly interested in <span className="highlight">Web Development,</span>{' '}
            <span className="highlight">Front-End Development,</span> and{' '}
            <span className="highlight">IT Support roles</span>. However, I am also <span className="highlight">open to any position </span>
            that aligns with my <span className="highlight">academic background</span> and <span className="highlight">internship experience</span>,
            especially if it presents a great opportunity for me to grow and improve my skills.
          </p>

          <p className="mt-6">
            I am based in <span className="highlight">North Caloocan City</span> and I&apos;m open
            to on-site or hybrid setups within a reasonable commute, as well as remote work.
          </p>

          <p className="mt-6">
            Regarding my schedule, I&apos;m mostly looking for{' '}
            <span className="highlight">weekday roles</span>. Saturdays are negotiable,
            but as much as possible, I&apos;d like to keep my{' '}
            <span className="highlight">
              Sundays free of work
            </span>.
          </p>

          <p className="mt-6">
            Thank you so much for stopping by my portfolio and for your time and
            consideration. <span className="highlight">I hope you&apos;re having a great day!</span>
          </p>

          <div className="mt-6">
            <p className="closing">Regards,</p>
            <p className="signature inline-flex items-center">
              <span>Josh</span>
              <span className="terminal-cursor" />
            </p>
          </div>
        </div>
      </HireModal>
    </header>
  );
}
