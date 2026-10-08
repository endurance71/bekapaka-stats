import { lazy, Suspense } from 'react';
import { PageLoader } from './shared/ui/PageLoader';
import { Route, Routes, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Shell from './components/Shell';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { SeasonPreferenceProvider } from './context/SeasonPreferenceContext';
import ProtectedRoute from './components/ProtectedRoute';
import RedirectPreserveSearch from './shared/ui/RedirectPreserveSearch';

// Eager-loaded: pages the user lands on first
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

// Lazy-loaded: heavy pages loaded on demand
const Trends = lazy(() => import('./pages/Trends'));
const Profile = lazy(() => import('./pages/Profile'));
const Administration = lazy(() => import('./pages/Administration'));
const GameCenter = lazy(() => import('./pages/GameCenter'));
const GameDetail = lazy(() => import('./pages/GameDetail'));
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'));
const League = lazy(() => import('./pages/League'));
const ScoutingPage = lazy(() => import('./pages/ScoutingPage'));
const AiCenterPage = lazy(() => import('./pages/AiCenterPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
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
                      <Route path="/rywal" element={<ScoutingPage />} />
                      <Route path="/druzyna" element={<TeamPage />} />
                      {/* stare adresy (zakładki, linki z AI, skróty PWA) */}
                      <Route path="/scouting" element={<RedirectPreserveSearch to="/rywal" />} />
                      <Route path="/roster" element={<RedirectPreserveSearch to="/druzyna" />} />
                      <Route path="/tactics" element={<RedirectPreserveSearch to="/druzyna" extra={{ widok: 'zagrywki' }} />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/players/:id" element={<PlayerProfile />} />
                      <Route
                        path="/trends"
                        element={
                          <ProtectedRoute requireAdmin>
                            <Trends />
                          </ProtectedRoute>
                        }
                      />
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
