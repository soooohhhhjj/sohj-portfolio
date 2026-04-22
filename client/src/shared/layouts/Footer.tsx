import { useEffect } from 'react';
import './footer.css';

const footerLinks = [
  {
    label: 'Back to the top',
    sectionId: 'home-top',
    shortcutKey: '1',
    shortcutLabel: 'or press Ctrl + 1',
  },
  {
    label: 'Experience',
    sectionId: 'relevant-experiences-section',
    shortcutKey: '2',
    shortcutLabel: 'or press Ctrl + 2',
  },
  {
    label: 'Skills',
    sectionId: 'skills-section',
    shortcutKey: '3',
    shortcutLabel: 'or press Ctrl + 3',
  },
] as const;

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/soooohhhhjj',
  },
  {
    label: 'LinkedIn',
    href: 'http://linkedin.com/in/carlojoshua-abellera',
  },
  {
    label: 'Email',
    href: 'mailto:carlojoshua.abellera.ph@gmail.com',
  },
] as const;

const FOOTER_SCROLL_DURATION_MS = 1550;

let activeFooterScrollFrame: number | null = null;

function cubicBezier(progress: number, p1y: number, p2y: number) {
  const inverse = 1 - progress;

  return (
    3 * inverse * inverse * progress * p1y +
    3 * inverse * progress * progress * p2y +
    progress * progress * progress
  );
}

function easeFooterScroll(progress: number) {
  const heroEase = cubicBezier(progress, 0.7, 0.9);

  return 1 - (1 - heroEase) ** 1.35;
}

function animateScrollTo(targetY: number) {
  if (activeFooterScrollFrame !== null) {
    window.cancelAnimationFrame(activeFooterScrollFrame);
    activeFooterScrollFrame = null;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;

  if (Math.abs(distance) < 1) {
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / FOOTER_SCROLL_DURATION_MS, 1);
    const easedProgress = easeFooterScroll(progress);

    window.scrollTo({
      top: startY + distance * easedProgress,
      behavior: 'auto',
    });

    if (progress < 1) {
      activeFooterScrollFrame = window.requestAnimationFrame(step);
      return;
    }

    root.style.scrollBehavior = previousScrollBehavior;
    activeFooterScrollFrame = null;
  };

  window.scrollTo({
    top: startY + distance * 0.01,
    behavior: 'auto',
  });
  activeFooterScrollFrame = window.requestAnimationFrame(step);
}

function scrollToSection(sectionId: string) {
  if (sectionId === 'home-top') {
    animateScrollTo(0);
    return;
  }

  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const targetY = window.scrollY + section.getBoundingClientRect().top;
  animateScrollTo(targetY);
}

export function Footer() {
  const year = new Date().getFullYear();
  const resumeUrl = `${import.meta.env.BASE_URL}sohj-resume.pdf`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      const targetLink = footerLinks.find((link) => link.shortcutKey === event.key);

      if (!targetLink) {
        return;
      }

      event.preventDefault();
      scrollToSection(targetLink.sectionId);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <footer className="section-style relative z-10 mt-16 border-t border-white/10 bg-black/60 text-[var(--base-text-color)] md:mt-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_115%)] opacity-60" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="section-content responsiveness content-width content-width--lg">
        <div
          className="
            relative overflow-hidden px-0 py-8
            sm:pt-10 sm:pb-8
          "
        >
          <div className="relative z-[1]">
            {/* < md: brand + navigate on the same row, connect below */}
            <div className="flex flex-col gap-8 md:hidden">
              <div className="flex items-start justify-between gap-10">
                <div className="min-w-0">
                  <div className="flex max-w-[360px] flex-col gap-4">
                    <div>
                      <p className="font-bruno text-[18px] tracking-[2px] text-[var(--base-text-color)]">
                        sohj.abe
                      </p>
                      <p className="font-jura text-[13px] leading-relaxed text-[rgb(var(--base-text-color-rgb)_/_0.55)] mt-2">
                        Building pixel-perfect interactive websites with a strong focus on clean
                        UI and thoughtful frontend detail.
                      </p>
                    </div>
                    <p className="font-jura text-[13px] tracking-[0.35px] text-[rgb(var(--base-text-color-rgb)_/_0.55)]">
                      Full-Stack Developer
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex justify-end">
                  <div className="text-left">
                    <div className="flex flex-col gap-[7px]">
                      <p className="font-bruno mt-[6px] text-[12px] tracking-[1px] text-[rgb(var(--base-text-color-rgb)_/_0.9)]">
                        Navigate
                      </p>
                      <div className="flex flex-col items-start gap-[6px]">
                        {footerLinks.map((link) => (
                          <div key={link.label} className="group relative">
                            <button
                              type="button"
                              onClick={() => scrollToSection(link.sectionId)}
                              className="font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.65)] transition-colors duration-200 hover:text-[var(--base-text-color)]"
                            >
                              {link.label}
                            </button>

                            <span
                              className="footer-tooltip footer-tooltip--mobile"
                            >
                              or just press{' '}
                              <span className="footer-tooltip__keybind">
                                {`Ctrl + ${link.shortcutKey}`}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-bruno text-[12px] tracking-[1px] text-[rgb(var(--base-text-color-rgb)_/_0.9)]">
                  Connect
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {socialLinks.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                      className="
                        inline-flex items-center px-[2px]
                        font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.7)] underline underline-offset-[5px]
                        transition-colors duration-200 hover:text-[var(--base-text-color)]
                      "
                    >
                      <span>{label}</span>
                    </a>
                  ))}

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      inline-flex items-center px-[2px]
                      font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.7)] underline underline-offset-[5px]
                      transition-colors duration-200 hover:text-[var(--base-text-color)]
                    "
                  >
                    <span>Download Resume</span>
                  </a>
                </div>
              </div>
            </div>

            {/* md+: keep the original multi-column layout */}
            <div
              className="
                hidden flex-col gap-8
                md:flex md:flex-row md:items-start md:justify-between
              "
            >
              <div className="flex max-w-[360px] flex-col gap-3">
                <div>
                  <p className="font-bruno text-[18px] tracking-[2px] text-[var(--base-text-color)]">
                    sohj.abe
                  </p>
                  <p className="font-jura text-[13px] leading-relaxed text-[rgb(var(--base-text-color-rgb)_/_0.55)] mt-1">
                    Building pixel-perfect interactive websites with a strong focus on clean
                    UI and thoughtful frontend detail.
                  </p>
                </div>
                <p className="font-jura text-[13px] tracking-[0.35px] text-[rgb(var(--base-text-color-rgb)_/_0.55)]">
                  Full-Stack Developer
                </p>
              </div>

              <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
                <div className="flex flex-col gap-2">
                  <p className="font-bruno text-[12px] tracking-[1px] text-[rgb(var(--base-text-color-rgb)_/_0.9)]">
                    Navigate
                  </p>
                  <div className="flex flex-col items-start gap-2">
                    {footerLinks.map((link) => (
                      <div key={link.label} className="group relative">
                        <button
                          type="button"
                          onClick={() => scrollToSection(link.sectionId)}
                          className="font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.45)] transition-colors duration-200 hover:text-[var(--base-text-color)]"
                        >
                          {link.label}
                        </button>

                        <span
                          className="footer-tooltip footer-tooltip--desktop"
                        >
                          or just press{' '}
                          <span className="footer-tooltip__keybind">
                            {`Ctrl + ${link.shortcutKey}`}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="font-bruno text-[12px] tracking-[1px] text-[rgb(var(--base-text-color-rgb)_/_0.9)]">
                    Connect
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {socialLinks.map(({ label, href }) => (
                      <a
                        key={label}
                        href={href}
                        target={href.startsWith('mailto:') ? undefined : '_blank'}
                        rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                        className="
                          inline-flex items-center px-[2px]
                          font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.7)] underline underline-offset-[5px]
                          transition-colors duration-200 hover:text-[var(--base-text-color)]
                        "
                      >
                        <span>{label}</span>
                      </a>
                    ))}
                  </div>

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-[2px]
                      font-jura text-[12px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.7)] underline underline-offset-[5px]
                      transition-colors duration-200 hover:text-[var(--base-text-color)]
                    "
                  >
                    <span>Download Resume</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 mb-6 h-px w-full bg-white/15" />

          <div className="font-jura text-[11px] tracking-[0.3px] text-[rgb(var(--base-text-color-rgb)_/_0.45)]">
            <span className="block text-center sm:hidden">
              Designed and built with React + Tailwind by sohj.abe
            </span>

            <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between">
              <span>{`© ${year} sohj.abe. All rights reserved.`}</span>
              <span>Designed and built with React + Tailwind.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
