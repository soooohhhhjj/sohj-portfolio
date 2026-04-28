import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { OverlayModal } from '../components/OverlayModal/OverlayModal';
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
          <h1 className="icon-text font-bruno text-[17px] font-[500] tracking-[2px] text-[rgb(247,247,217)] xxsm:text-[20px] sm:text-[24px] md:text-[18px] lg:text-[20px]">
            {'sohj.abe'.split('').map((char, index) => (
              <span key={index} className={`char-${index} ${runFlicker ? 'flicker-once' : ''}`}>
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

      <OverlayModal
        isOpen={isHireLetterOpen}
        onClose={() => setIsHireLetterOpen(false)}
        rootClassName="fixed inset-0 z-[90]"
        backdropClassName="absolute inset-0 bg-black"
        dialogClassName="relative h-screen w-screen bg-black text-[#f3f0e8]"
        bodyClassName="h-full overflow-y-auto"
        titleId="hire-letter-title"
        dialogDuration={0.35}
      >
        <div className="responsiveness flex min-h-screen items-start py-[96px] xxsm:py-[104px] sm:py-[112px] md:py-[128px]">
          <div className="hire-letter-panel w-full max-w-[920px]">
            <p
              id="hire-letter-title"
              className="font-jura text-[12px] uppercase tracking-[0.22em] text-[#7df7b6] xxsm:text-[13px] sm:text-[14px]"
            >
              Subject: Availability for Entry-Level Web and IT Opportunities
            </p>

            <div className="mt-8 space-y-6 font-jura text-[15px] leading-[1.9] text-[#f3f0e8] xxsm:text-[16px] sm:text-[17px] md:mt-10 md:text-[18px]">
              <p>
                I am a fresh graduate currently available for opportunities in web development,
                front-end development, and other IT-related roles aligned with my academic
                background and internship experience.
              </p>

              <p>
                While I am still exploring which specialization to focus on long-term, I am open
                to roles where I can apply my foundational skills, continue learning, and
                contribute meaningfully to a team.
              </p>

              <p>
                I am particularly interested in positions involving web technologies, systems
                support, or general IT operations, but I remain flexible as long as the role is
                relevant to my field and offers opportunities for growth.
              </p>

              <p>Thank you for your time and consideration.</p>
            </div>

            <div className="mt-12 flex justify-end md:mt-16">
              <div className="font-jura text-right text-[15px] leading-[1.9] text-[#f3f0e8] xxsm:text-[16px] sm:text-[17px] md:text-[18px]">
                <p>Regards,</p>
                <p>sohj</p>
              </div>
            </div>
          </div>
        </div>
      </OverlayModal>
    </header>
  );
}
