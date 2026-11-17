/**
 * Client language for React islands.
 *
 * SSR always renders the ES default, matching the static HTML. After
 * hydration the hook reads `<html lang>` and follows the in-page language
 * toggle (which sets that attribute), so an island never hydrates against a
 * different language than the server rendered and switching language updates
 * the islands without a reload.
 */
import { useEffect, useState } from 'react';
import type { Lang } from './i18n';

export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>('es');

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setLang(root.lang === 'en' ? 'en' : 'es');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  return lang;
}
