import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { startenAbgleich, stoppenAbgleich, useKonto } from './lib/sync';
import { useTheme } from './lib/theme';
import Einstellungen from './routes/Einstellungen';
import Erhoert from './routes/Erhoert';
import Gebet from './routes/Gebet';
import Gedenkliste from './routes/Gedenkliste';
import Heute from './routes/Heute';
import Jesusgebet from './routes/Jesusgebet';
import Tagebuch from './routes/Tagebuch';
import ThemaGebete from './routes/ThemaGebete';
import ThemaNeu from './routes/ThemaNeu';
import Themen from './routes/Themen';

export default function App() {
  useTheme();

  // Bei angemeldetem Konto den Abgleich starten; ohne Konto läuft alles lokal.
  const konto = useKonto();
  useEffect(() => {
    if (!konto?.uid) return;
    void startenAbgleich(konto.uid);
    return () => stoppenAbgleich();
  }, [konto?.uid]);

  return (
    <Routes>
      <Route path="/" element={<Heute />} />
      {/* Eine Benachrichtigung öffnet die Gebetsansicht der jeweiligen Tageszeit. */}
      <Route path="/gebet/:tageszeit" element={<Gebet />} />
      <Route path="/jesusgebet" element={<Jesusgebet />} />
      <Route path="/themen" element={<Themen />} />
      <Route path="/themen/neu" element={<ThemaNeu />} />
      <Route path="/themen/:id/gebete" element={<ThemaGebete />} />
      <Route path="/gedenkliste" element={<Gedenkliste />} />
      <Route path="/tagebuch" element={<Tagebuch />} />
      <Route path="/erhoert" element={<Erhoert />} />
      <Route path="/einstellungen" element={<Einstellungen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
