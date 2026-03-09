import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import type { Ref } from 'react';
import { GlassCard } from '../../../shared/components/GlassCard';
import './Journey/CSS/Journey.css';
import { journeyTimelineGroups } from './Journey/journeyTimeline';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface Props {
  shouldShow: boolean;
  contentRef?: Ref<HTMLDivElement>;
}

const showcaseGroup = journeyTimelineGroups[0];
const showcaseChild = showcaseGroup?.children[0];

export default function Journey({ shouldShow, contentRef }: Props) {
  if (!showcaseGroup || !showcaseChild) {
    return null;
  }

  const ParentIcon = showcaseGroup.parent.icon;

  return (
    <motion.section
      initial={{ y: '100vh' }}
      animate={{ y: shouldShow ? 0 : '100vh' }}
      transition={{ duration: 1.35, ease: easeSmooth, delay: 0.1 }}
      className={`journey-section ${shouldShow ? 'journey-section--visible' : 'journey-section--hidden'}`}
    >
      <div className="journey-shell">
        <div className="journey-shell__layer journey-shell__layer--diagonal" />
        <div className="journey-shell__layer journey-shell__layer--vertical" />
        <div className="journey-shell__layer journey-shell__layer--inner-shadow" />

        <div ref={contentRef} className="journey-shell__content journey-map responsiveness">
          <div className="journey-map__hero">
            <h2 className="journey-map__title">My Journey</h2>
          </div>

          <div className="journey-showcase">
            <article className="journey-map-card journey-showcase__card journey-showcase__card--parent">
              <div className="journey-map-card__parent-header">
                <div className="journey-map-card__icon-shell">
                  {ParentIcon ? <ParentIcon className="journey-map-card__icon" strokeWidth={1.6} /> : null}
                </div>
                <h3 className="journey-map-card__title font-jura">{showcaseGroup.parent.title}</h3>
              </div>
              <p className="journey-map-card__details">
                {showcaseGroup.parent.modalDetails ?? 'Milestone summary coming soon.'}
              </p>
            </article>

            <div className="journey-showcase__connector" aria-hidden="true" />

            <article className="journey-map-card journey-showcase__card journey-showcase__card--child">
              {showcaseChild.image ? (
                <GlassCard
                  width="w-full"
                  corner="rounded-[4px]"
                  shadow=""
                  className="overflow-hidden journey-map-card__media"
                >
                  <img
                    src={showcaseChild.image}
                    alt={showcaseChild.title ?? showcaseChild.id}
                    className="journey-map-card__image"
                    draggable={false}
                  />
                </GlassCard>
              ) : null}
              <h4 className="journey-map-card__child-title font-jura">{showcaseChild.title ?? showcaseChild.id}</h4>
              <p className="journey-map-card__details">{showcaseChild.details ?? 'Details coming soon.'}</p>
            </article>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
