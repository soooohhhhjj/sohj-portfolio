import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import './navbar.css';

interface NavbarProps {
  mode?: 'default' | 'home';
  shouldAnimate?: boolean;
}

export function Navbar({ mode = 'home', shouldAnimate = true }: NavbarProps) {
  const shouldRender = mode !== 'home' || shouldAnimate;
  const [runFlicker, setRunFlicker] = useState(false);

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
          <h1 className="icon-text font-bruno text-[17px] font-[500] tracking-[2px] text-[rgb(247,247,217)] xxsm:text-[20px] sm:text-[24px] md:text-[18px] lg:text-[20px]">
            {'sohj.abe'.split('').map((char, index) => (
              <span key={index} className={`char-${index} ${runFlicker ? 'flicker-once' : ''}`}>
                {char}
              </span>
            ))}
          </h1>

      <div className="hire-status mb-[7px] flex items-center gap-2 text-[#7df7b6]">
        <span className="hire-status-dot" aria-hidden="true" />
        <span className="hire-status-text font-jura text-[11px] leading-[1] tracking-[0.08em]">
          Available for hire
        </span>
      </div>

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

    </header>
  );
}
