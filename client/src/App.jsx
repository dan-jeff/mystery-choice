import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AppShell from './components/shell/AppShell.jsx';
import SpinnerScreen from './components/spinner/SpinnerScreen.jsx';
import HistoryScreen from './components/history/HistoryScreen.jsx';
import SettingsScreen from './components/settings/SettingsScreen.jsx';
import SpinnerSettings from './components/settings/SpinnerSettings.jsx';
import HistorySettings from './components/settings/HistorySettings.jsx';
import FeedbackSettings from './components/settings/FeedbackSettings.jsx';
import DataSettings from './components/settings/DataSettings.jsx';
import ManageGames from './components/settings/ManageGames.jsx';
import About from './components/settings/About.jsx';
import PermissionsExplainer from './components/PermissionsExplainer.jsx';
import { useGames } from './hooks/useGames.js';
import { useSettings } from './hooks/useSettings.js';

const ACK_KEY = 'permissions_acknowledged_v1';

function PermissionsGate({ children }) {
  const qc = useQueryClient();
  const { settings } = useSettings();
  const { games, isLoading } = useGames();

  if (isLoading) return null;

  const acknowledged = settings[ACK_KEY] === true;
  if (!acknowledged && games.length === 0) {
    return (
      <PermissionsExplainer onContinue={() => qc.invalidateQueries({ queryKey: ['settings'] })} />
    );
  }
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <PermissionsGate>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<SpinnerScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/settings" element={<SettingsScreen />}>
              <Route index element={<SpinnerSettings />} />
              <Route path="spinner" element={<SpinnerSettings />} />
              <Route path="games" element={<ManageGames />} />
              <Route path="history" element={<HistorySettings />} />
              <Route path="feedback" element={<FeedbackSettings />} />
              <Route path="data" element={<DataSettings />} />
              <Route path="about" element={<About />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </PermissionsGate>
    </HashRouter>
  );
}
