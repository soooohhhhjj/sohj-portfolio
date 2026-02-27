import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BREAKPOINTS } from '../constants/breakpoints';
import './navbar.css';

interface NavbarProps {
  mode?: 'default' | 'home';
  shouldAnimate?: boolean;
}

export function Navbar({ mode = 'home', shouldAnimate = true }: NavbarProps) {
  const shouldRender = mode !== 'home' || shouldAnimate;
  const [runFlicker, setRunFlicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (mode !== 'home' || !shouldAnimate) return;
    const timer = setTimeout(() => setRunFlicker(true), 1600);
    return () => clearTimeout(timer);
  }, [mode, shouldAnimate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= BREAKPOINTS.lg) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home-top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsMenuOpen(false);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <header>
      <div className="responsiveness">
        <motion.nav
          initial={motionProps.initial}
          animate={motionProps.animate}
          transition={{ duration: 0.6, ease: [0.12, 0.7, 0.63, 0.9] }}
          className="w-full flex justify-between items-center lg:items-end mt-[30px] md:mt-[32px] lg:mt-[30px] relative z-0"
        >
          <h1 className="icon-text font-bruno text-[15px] font-[500] text-white tracking-[2px] sm:text-[20px] md:text-[18px] lg:text-[20px]">
            {'sohj.abe'.split('').map((char, i) => (
              <span key={i} className={`char-${i} ${runFlicker ? 'flicker-once' : ''}`}>
                {char}
              </span>
            ))}
          </h1>

          <div className="items-center hidden gap-6 nav-links lg:flex">
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('home-top')}
            >
              Home
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('projects-section')}
            >
              Projects
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('about-section')}
            >
              About Me
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('contact-section')}
            >
              Contact
            </button>
          </div>

          <button
            type="button"
            className={`hamburger inline-flex lg:hidden ${isMenuOpen ? 'is-open' : ''}`}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </button>
        </motion.nav>

        <div className={`nav-mobile flex flex-col lg:hidden ${isMenuOpen ? 'nav-open' : ''}`}>
          <div className="flex flex-col items-start gap-4 pt-4 nav-links">
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('home-top')}
            >
              Home
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('projects-section')}
            >
              Projects
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('about-section')}
            >
              About Me
            </button>
            <button
              type="button"
              className="p-0 bg-transparent border-0 nav-link nav-link-size"
              onClick={() => scrollToSection('contact-section')}
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
