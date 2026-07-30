/**
 * Theme-Umschaltung. Die Farbwerte selbst liegen in `src/styles/global.css`
 * und stammen unverändert aus dem Design-Entwurf.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';

import { db } from './db';
import { EINSTELLUNGEN_ID, type Erscheinungsbild } from './types';

export function useErscheinungsbild(): Erscheinungsbild {
  return useLiveQuery(
    async (): Promise<Erscheinungsbild> =>
      (await db.einstellungen.get(EINSTELLUNGEN_ID))?.erscheinungsbild ?? 'system',
    [],
    'system' as Erscheinungsbild,
  );
}

/**
 * Setzt `data-theme` auf dem Wurzelelement. Bei „system" folgt die App der
 * Einstellung des Geräts und reagiert auf einen Wechsel während der Laufzeit.
 */
export function useTheme(): void {
  const erscheinungsbild = useErscheinungsbild();

  useEffect(() => {
    const wurzel = document.documentElement;

    if (erscheinungsbild !== 'system') {
      wurzel.dataset.theme = erscheinungsbild === 'dunkel' ? 'dark' : 'light';
      return;
    }

    const abfrage = window.matchMedia('(prefers-color-scheme: dark)');
    const anwenden = () => {
      wurzel.dataset.theme = abfrage.matches ? 'dark' : 'light';
    };

    anwenden();
    abfrage.addEventListener('change', anwenden);
    return () => abfrage.removeEventListener('change', anwenden);
  }, [erscheinungsbild]);
}
