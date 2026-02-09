import { Route, Routes, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Trends from './pages/Trends';
import Administration from './pages/Administration';
import GameCenter from './pages/GameCenter';
import GameDetail from './pages/GameDetail';
import PlayerProfile from './pages/PlayerProfile';
import Protocols from './pages/Protocols';
import Training from './pages/Training';
import League from './pages/League';
import ScoutingPage from './pages/ScoutingPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/league" element={<League />} />
                  <Route path="/scouting" element={<ScoutingPage />} />
                  <Route path="/roster" element={<Roster />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/players/:id" element={<PlayerProfile />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Administration />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/games" element={<GameCenter />} />
                  <Route path="/games/:id" element={<GameDetail />} />
                  <Route path="/protocols" element={<Protocols />} />
                </Routes>
              </Shell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
