import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { FOOTER_LINKS, FOOTER_META, FOOTER_SOCIALS } from './footerData';
import { footerStyles } from './footerStyles';

export function Footer() {
  const year = new Date().getFullYear();
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    if (!showCopyToast) return;
    const timer = window.setTimeout(() => setShowCopyToast(false), 3200);
    return () => window.clearTimeout(timer);
  }, [showCopyToast]);

  const scrollToSectionTop = (sectionId: string) => {
    if (sectionId === 'home-top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('carlojoshua.abellera.ph@gmail.com');
      setShowCopyToast(true);
    } catch {
      setShowCopyToast(false);
    }
  };

  return (
    <section className={footerStyles.section}>
      {showCopyToast && (
        <div className="fixed inset-x-0 top-4 z-[320] flex justify-center px-4">
          <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-[8px] border border-emerald-300/40 bg-[#06120d]/95 px-4 py-3 shadow-[0_0_22px_rgba(52,211,153,0.25)] backdrop-blur-sm">
            <p className="font-jura text-xs text-emerald-100 sm:text-sm">
              Email carlojoshua.abellera.ph copied to clipboard
            </p>
            <button
              type="button"
              aria-label="Close copy notification"
              onClick={() => setShowCopyToast(false)}
              className="group p-1.5 text-emerald-200/80 transition-colors hover:text-emerald-100"
            >
              <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>
        </div>
      )}

      <div className={footerStyles.content}>
        <div className={footerStyles.wrapper}>
          <footer className={footerStyles.card}>
            <div className={footerStyles.layout}>
              <div className={footerStyles.brand}>
                <span className={footerStyles.name}>{FOOTER_META.name}</span>
                <span className={footerStyles.role}>{FOOTER_META.role}</span>
                <p className={footerStyles.tagline}>{FOOTER_META.tagline}</p>
              </div>

              <div className={footerStyles.columns}>
                <div>
                  <p className={footerStyles.columnTitle}>Explore</p>
                  <div className={footerStyles.linkList}>
                    {FOOTER_LINKS.map((link) => (
                      <button
                        key={link.label}
                        type="button"
                        className={`${footerStyles.link} border-0 bg-transparent p-0 text-left`}
                        onClick={() => scrollToSectionTop(link.sectionId)}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={footerStyles.columnTitle}>Connect</p>
                  <div className={footerStyles.socialList}>
                    {FOOTER_SOCIALS.map(({ label, href, Icon }) =>
                      label === 'Email' ? (
                        <button
                          key={label}
                          type="button"
                          onClick={handleCopyEmail}
                          className={footerStyles.socialLink}
                        >
                          <Icon className={footerStyles.socialIcon} />
                          <span>{label}</span>
                        </button>
                      ) : (
                        <a
                          key={label}
                          className={footerStyles.socialLink}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Icon className={footerStyles.socialIcon} />
                          <span>{label}</span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={footerStyles.divider} />

            <div className={footerStyles.bottomRow}>
              <span>(c) {year} {FOOTER_META.name}. All rights reserved.</span>
              <span>Designed and built with React + Tailwind.</span>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
