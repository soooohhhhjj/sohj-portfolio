import {
  ArrowUpRight,
  Bug,
  ChevronRight,
  FileText,
  Github,
  GraduationCap,
  Layers,
  Linkedin,
  Mail,
  MonitorCog,
  ServerCog,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Navbar } from '../../../shared/layouts';
import { Section, SectionContent } from '../../../shared/components/Container';
import { GlassCard } from '../../../shared/components/GlassCard';
import './proposal/HomeProposal.css';

const skillCards = [
  {
    title: 'Frontend Development',
    description: 'Responsive UI work with React, TypeScript, Tailwind, animation, and clean component structure.',
    Icon: Layers,
  },
  {
    title: 'Backend Foundations',
    description: 'REST APIs, data flow, authentication basics, and connecting interfaces to real application logic.',
    Icon: ServerCog,
  },
  {
    title: 'Debugging Mindset',
    description: 'Tracing issues, fixing edge cases, and improving reliability when projects become messy or fragile.',
    Icon: Bug,
  },
  {
    title: 'Support Readiness',
    description: 'Troubleshooting, deployment help, documentation, and practical handling of day-to-day technical blockers.',
    Icon: MonitorCog,
  },
];

const featuredProjects = [
  {
    title: 'System Architecture Thesis',
    image: `${import.meta.env.BASE_URL}Journey/node4/sysarch.PNG`,
    stack: 'MERN Stack',
    summary: 'Inventory management system built as a lead-developer thesis project focused on workflow, structure, and usability.',
  },
  {
    title: 'Capstone Thesis',
    image: `${import.meta.env.BASE_URL}Journey/node4/capstone-thesis.png`,
    stack: 'PHP · MySQL',
    summary: 'Academic system work involving planning, debugging, feature support, and turning requirements into something usable.',
  },
  {
    title: 'JFCM Website Platform',
    image: `${import.meta.env.BASE_URL}Journey/node5/portfolio-v2.PNG`,
    stack: 'React · CMS Direction',
    summary: 'A content-focused platform direction centered on practical structure, maintainability, and real-world handoff value.',
  },
  {
    title: 'Personal File Converter',
    image: `${import.meta.env.BASE_URL}Journey/node3/class-funds3.jpg`,
    stack: 'Utility Tool Concept',
    summary: 'A local-first tool direction shaped around simple, practical problem solving and user convenience.',
  },
];

const journeyFacts = [
  'Fresh BSIT graduate with internship, thesis, and hands-on build experience.',
  'Comfortable moving between visual frontend work and practical problem solving.',
  'Interested in tools that feel useful, maintainable, and easy for people to understand.',
  'Still early in my career, but serious about ownership, consistency, and professional growth.',
];

const contactLinks = [
  {
    label: 'Resume',
    href: `${import.meta.env.BASE_URL}sohj-resume.pdf`,
    Icon: FileText,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/soooohhhhjj',
    Icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'http://linkedin.com/in/carlojoshua-abellera',
    Icon: Linkedin,
  },
  {
    label: 'Email',
    href: 'mailto:carlojoshua.abellera.ph@gmail.com',
    Icon: Mail,
  },
];

export function HomeProposal() {
  return (
    <div className="proposal-page base-text-color">
      <div id="home-top" />
      <Navbar mode="default" />

      <Section className="section-style relative z-10 mt-[30px] base-text-color">
        <SectionContent className="proposal-hero flex flex-col gap-16">
          <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-8 lg:gap-12">
            <GlassCard
              width="max-w-full md:max-w-[272px] lg:max-w-[320px]"
              corner="rounded-[7px]"
              shadow="shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              className="overflow-hidden proposal-hero__image-card"
            >
              <img
                src={`${import.meta.env.BASE_URL}prof-pic.jpg`}
                alt="Carlo Joshua B. Abellera"
                className="object-cover object-top w-full h-full"
              />
            </GlassCard>

            <div className="flex-1 max-w-[620px] text-center md:text-start md:mt-2">
              <p className="proposal-hero__intro">
                Hi, I&apos;m <span>Carlo Joshua B. Abellera</span>
              </p>

              <h1 className="proposal-hero__headline mt-3">
                Building polished
                <br />
                full-stack products
                <br />
                with practical purpose
              </h1>

              <p className="proposal-hero__role mt-8">IT Graduate & Full-Stack Developer</p>

              <p className="proposal-hero__summary mt-6">
                I build responsive web experiences, work through messy technical problems, and care
                about making systems feel useful, reliable, and worth maintaining.
              </p>

              <div className="proposal-hero__cta-row mt-8">
                <a
                  href={`${import.meta.env.BASE_URL}sohj-resume.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proposal-primary-cta"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Resume</span>
                </a>

                <a href="#projects-section" className="proposal-secondary-cta">
                  <Sparkles className="w-4 h-4" />
                  <span>See Projects</span>
                </a>
              </div>

              <div className="proposal-social-links mt-7">
                {contactLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={label === 'Email' ? undefined : '_blank'}
                    rel={label === 'Email' ? undefined : 'noopener noreferrer'}
                    className="proposal-social-link"
                  >
                    <Icon className="proposal-social-link__icon" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div id="tech-stack-section" className="proposal-skill-grid">
            {skillCards.map(({ title, description, Icon }) => (
              <GlassCard key={title} corner="rounded-[7px]" className="proposal-skill-card">
                <div className="proposal-skill-card__icon-wrap">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="proposal-skill-card__title">{title}</h2>
                <p className="proposal-skill-card__body">{description}</p>
              </GlassCard>
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section className="section-style proposal-section-shell">
        <SectionContent className="proposal-section-content">
          <div id="projects-section">
            <div className="proposal-section-heading">
              <p className="proposal-section-heading__eyebrow">Selected Work</p>
              <h2 className="proposal-section-heading__title">Projects That Reflect How I Build</h2>
              <p className="proposal-section-heading__copy">
                A mix of thesis, system, and product-oriented work that shows structure, iteration, and practical execution.
              </p>
            </div>

            <div className="proposal-project-grid">
              {featuredProjects.map(({ title, image, stack, summary }) => (
                <GlassCard key={title} corner="rounded-[7px]" className="proposal-project-card">
                  <div className="proposal-project-card__image-wrap">
                    <img src={image} alt={title} className="proposal-project-card__image" />
                  </div>

                  <div className="proposal-project-card__content">
                    <p className="proposal-project-card__stack">{stack}</p>
                    <h3 className="proposal-project-card__title">{title}</h3>
                    <p className="proposal-project-card__summary">{summary}</p>
                    <div className="proposal-project-card__link">
                      <span>Project Highlight</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </SectionContent>
      </Section>

      <Section className="section-style proposal-section-shell">
        <SectionContent className="proposal-section-content">
          <div id="about-section" className="proposal-about-grid">
            <GlassCard corner="rounded-[7px]" className="proposal-about-card proposal-about-card--story">
              <p className="proposal-section-heading__eyebrow">About Me</p>
              <h2 className="proposal-section-heading__title proposal-section-heading__title--about">
                Growing from projects into professional work
              </h2>
              <p className="proposal-about-card__copy">
                My path into IT started with curiosity, turned into real enjoyment through programming,
                and kept growing as I handled more complex systems, debugging, and collaborative project work.
              </p>
              <p className="proposal-about-card__copy">
                I enjoy frontend polish, but I care just as much about making things understandable,
                maintainable, and genuinely useful to the people who rely on them.
              </p>
            </GlassCard>

            <GlassCard corner="rounded-[7px]" className="proposal-about-card proposal-about-card--facts">
              <p className="proposal-section-heading__eyebrow">What I Bring</p>
              <div className="proposal-fact-list">
                {journeyFacts.map((fact) => (
                  <div key={fact} className="proposal-fact-item">
                    <ChevronRight className="w-4 h-4 proposal-fact-item__icon" />
                    <p>{fact}</p>
                  </div>
                ))}
              </div>

              <div className="proposal-mini-stats">
                <div className="proposal-mini-stat">
                  <GraduationCap className="w-5 h-5" />
                  <span>BSIT Graduate</span>
                </div>
                <div className="proposal-mini-stat">
                  <MonitorCog className="w-5 h-5" />
                  <span>Internship Exposure</span>
                </div>
                <div className="proposal-mini-stat">
                  <Wrench className="w-5 h-5" />
                  <span>Builder Mindset</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </SectionContent>
      </Section>

      <Section className="section-style proposal-section-shell">
        <SectionContent className="proposal-section-content">
          <div id="contact-section">
            <GlassCard corner="rounded-[10px]" className="proposal-contact-panel">
              <div className="proposal-contact-panel__copy">
                <p className="proposal-section-heading__eyebrow">Contact</p>
                <h2 className="proposal-section-heading__title proposal-section-heading__title--contact">
                  Let&apos;s build something useful
                </h2>
                <p className="proposal-section-heading__copy">
                  Open to developer opportunities, junior full-stack roles, and tech environments where I can keep growing through real work.
                </p>
              </div>

              <div className="proposal-contact-panel__actions">
                {contactLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={label === 'Email' ? undefined : '_blank'}
                    rel={label === 'Email' ? undefined : 'noopener noreferrer'}
                    className="proposal-contact-action"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </GlassCard>
          </div>
        </SectionContent>
      </Section>

      <Section className="section-style proposal-footer-shell">
        <SectionContent className="proposal-footer">
          <footer className="proposal-footer__card">
            <div className="proposal-footer__brand">
              <span className="proposal-footer__name">sohj.abe</span>
              <span className="proposal-footer__role">IT Graduate & Full-Stack Developer</span>
            </div>

            <div className="proposal-footer__meta">
              <span>Designed and built with React + Tailwind.</span>
              <a href="#home-top" className="proposal-footer__top-link">Back to top</a>
            </div>
          </footer>
        </SectionContent>
      </Section>
    </div>
  );
}
