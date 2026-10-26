import { useEffect } from 'react';

/**
 * useScrollReveal Hook
 * Observes text elements as the user scrolls, triggering smooth cybernetic
 * fade-and-glide text reveal animations.
 */
export const useScrollReveal = () => {
  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-text, .scroll-reveal-title').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    // Auto-query target text elements and headings
    const targetElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-text, .scroll-reveal-title, .panel-kicker, .eyebrow, h1, h2, .briefing-copy p, .metric-card, .location-title-block'
    );

    targetElements.forEach((el) => {
      // Avoid re-attaching if already observed
      if (!el.classList.contains('scroll-reveal-registered')) {
        el.classList.add('scroll-reveal-registered');
        if (!el.classList.contains('scroll-reveal-text') && !el.classList.contains('scroll-reveal-title')) {
          el.classList.add('scroll-reveal');
        }
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};
