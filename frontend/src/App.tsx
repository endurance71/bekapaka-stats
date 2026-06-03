import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { SeasonPreferenceProvider } from './context/SeasonPreferenceContext';
import ProtectedRoute from './components/ProtectedRoute';

// Eager-loaded: pages the user lands on first
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

// Lazy-loaded: heavy pages loaded on demand
const Roster = lazy(() => import('./pages/Roster'));
const Trends = lazy(() => import('./pages/Trends'));
const Profile = lazy(() => import('./pages/Profile'));
const Administration = lazy(() => import('./pages/Administration'));
const GameCenter = lazy(() => import('./pages/GameCenter'));
const GameDetail = lazy(() => import('./pages/GameDetail'));
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'));
const League = lazy(() => import('./pages/League'));
const ScoutingPage = lazy(() => import('./pages/ScoutingPage'));
const AiCenterPage = lazy(() => import('./pages/AiCenterPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-bkpk-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-bkpk-text-muted font-bold uppercase tracking-widest text-xs">Ładowanie...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SeasonPreferenceProvider>
                <Shell>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/league" element={<League />} />
                      <Route path="/scouting" element={<ScoutingPage />} />
                      <Route path="/roster" element={<Roster />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/players/:id" element={<PlayerProfile />} />
                      <Route path="/trends" element={<Trends />} />
                      <Route path="/ai" element={<AiCenterPage />} />
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
                      <Route path="/protocols" element={<Navigate to="/games" replace />} />
                    </Routes>
                  </Suspense>
                </Shell>
                </SeasonPreferenceProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
