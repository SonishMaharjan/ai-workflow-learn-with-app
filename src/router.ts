import { useEffect, useState } from 'react';

/**
 * Tiny hash router so the app has zero routing dependencies.
 * Routes: #/  #/topic/:id/learn  #/topic/:id/practice  #/review  #/mock  #/tools
 */
export function useHashRoute(): string[] {
  const parse = () => (window.location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const [parts, setParts] = useState<string[]>(parse);

  useEffect(() => {
    const onChange = () => { setParts(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return parts;
}

export const go = (path: string) => { window.location.hash = '/' + path; };
