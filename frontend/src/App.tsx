import { lazy, Suspense } from 'react';
import { PageLoader } from './shared/ui/PageLoader';
import { Route, Routes, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
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
const TacticsHub = lazy(() => import('./pages/TacticsHub'));
const Glossary = lazy(() => import('./pages/Glossary'));


export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
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
                      <Route path="/slowniczek" element={<Glossary />} />
                      <Route path="/league" element={<League />} />
                      <Route path="/scouting" element={<ScoutingPage />} />
                      <Route path="/roster" element={<Roster />} />
                      <Route path="/tactics" element={<TacticsHub />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/players/:id" element={<PlayerProfile />} />
                      <Route path="/trends" element={<Trends />} />
                      <Route
                        path="/ai/:categorySlug?"
                        element={
                          <ProtectedRoute requireAdmin>
                            <AiCenterPage />
                          </ProtectedRoute>
                        }
                      />
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
                    </Routes>
                  </Suspense>
                </Shell>
                </SeasonPreferenceProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
