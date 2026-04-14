import { useLayoutEffect, useRef } from 'react';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Section, SectionContent } from '../../../shared/components/Container';
import { relevantExperiences } from './relevantExperiences.data';
import { truncateToFit } from './truncateToFit';
import './RelevantExperiences.css';

type CardTextProps = {
  text: string;
  className: string;
};

function TruncatedText({ text, className }: CardTextProps) {
  const textRef = useRef<HTMLParagraphElement | HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    truncateToFit(textRef.current, text);
  }, [text]);

  return <p ref={textRef as React.RefObject<HTMLParagraphElement>} className={className} />;
}

export function RelevantExperiences() {
  return (
    <Section className="relevant-experiences-section relative z-10 mt-24 text-[rgb(247,247,217)]">
      <div className="relevant-experiences-shell">
        <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--diagonal" />
        <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--vertical" />
        <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--inner-shadow" />

        <SectionContent className="relevant-experiences-shell__content relative z-[1]">
          <div className="relevant-experiences-intro text-center">
            <h2 className="relevant-experiences-intro__title font-anta">Relevant Experiences</h2>
          </div>

          <div className="relevant-experiences-list">
            {relevantExperiences.map(({ id, title, intro, icon: Icon, children }) => (
              <div key={id} className="relevant-experiences-group">
                <article className="relevant-experiences-card relevant-experiences-card--parent">
                  <div className="relevant-experiences-card__parent-header">
                    <div className="relevant-experiences-card__icon-shell">
                      <Icon className="relevant-experiences-card__icon" strokeWidth={1.4} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="relevant-experiences-card__title font-jura">{title}</h3>
                    </div>
                  </div>

                  <TruncatedText
                    text={intro}
                    className="relevant-experiences-card__details relevant-experiences-card__details--parent font-jura"
                  />
                </article>

                {children.map(({ id: childId, title: childTitle, details, image }) => (
                  <div key={childId} className="relevant-experiences-track-item">
                    <div className="relevant-experiences-group__connector" aria-hidden="true" />

                    <article className="relevant-experiences-card relevant-experiences-card--child">
                      <GlassCard
                        width="w-full"
                        corner="rounded-[2px]"
                        shadow=""
                        className="overflow-hidden relevant-experiences-card__image-wrap"
                      >
                        <img
                          src={image}
                          alt={childTitle}
                          className="relevant-experiences-card__image"
                          loading="lazy"
                        />
                      </GlassCard>

                      <h4 className="relevant-experiences-card__child-title font-jura">
                        {childTitle}
                      </h4>
                      <div className="relevant-experiences-card__child-copy font-jura">
                        <div className="relevant-experiences-card__child-detail-row">
                          <span className="relevant-experiences-card__child-detail-prefix">L</span>
                          <TruncatedText
                            text={details}
                            className="relevant-experiences-card__child-detail-text"
                          />
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </SectionContent>
      </div>
    </Section>
  );
}
