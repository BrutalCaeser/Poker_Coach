/**
 * Mark the page as scrolled (<html data-scrolled>) so the sticky top bar can
 * frost over content that slides under it, instead of letting half a line of
 * text show through its fade. One passive listener, no React renders.
 */
import { useEffect } from 'react';

export function useScrollFlag() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.toggleAttribute('data-scrolled', window.scrollY > 2);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      root.removeAttribute('data-scrolled');
    };
  }, []);
}
