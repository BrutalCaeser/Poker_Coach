/**
 * Load the v3 typefaces once: Fraunces (display) + Inter (UI).
 * Shared by the game shell and the boss lesson so both render identically.
 */
import { useEffect } from 'react';

export function useFonts() {
  useEffect(() => {
    if (document.getElementById('lx-fonts')) return;
    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = 'https://fonts.gstatic.com';
    pre.crossOrigin = '';
    const l = document.createElement('link');
    l.id = 'lx-fonts';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap';
    document.head.append(pre, l);
  }, []);
}
