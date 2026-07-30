import { Navigate, Route, Routes } from 'react-router-dom';

import { useTheme } from './lib/theme';
import Einstellungen from './routes/Einstellungen';
import Gebet from './routes/Gebet';
import Gedenkliste from './routes/Gedenkliste';
import Heute from './routes/Heute';
import Jesusgebet from './routes/Jesusgebet';
import ThemaNeu from './routes/ThemaNeu';
import Themen from './routes/Themen';

export default function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<Heute />} />
      {/* Eine Benachrichtigung öffnet die Gebetsansicht der jeweiligen Tageszeit. */}
      <Route path="/gebet/:tageszeit" element={<Gebet />} />
      <Route path="/jesusgebet" element={<Jesusgebet />} />
      <Route path="/themen" element={<Themen />} />
      <Route path="/themen/neu" element={<ThemaNeu />} />
      <Route path="/gedenkliste" element={<Gedenkliste />} />
      <Route path="/einstellungen" element={<Einstellungen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
