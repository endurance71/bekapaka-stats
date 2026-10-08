import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, SESSION_EXPIRED } from '../lib/api';
import { keys } from '../lib/queries';
import type { User } from '../lib/types';
import Login from './Login';
import AppShell from './AppShell';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectPage from '../pages/ProjectPage';
import AssetsPage from '../pages/AssetsPage';
import BrandPage from '../pages/BrandPage';
import ExportsPage from '../pages/ExportsPage';
import NotFound from '../pages/NotFound';

function SessionGate() {
  const client = useQueryClient();
  const me = useQuery({
    queryKey: keys.me,
    queryFn: () =>
      api<{ user: User }>('/auth/me')
        .then((v) => v.user)
        .catch(() => null),
    staleTime: Infinity,
  });
  useEffect(() => {
    const expire = () => {
      client.setQueryData(keys.me, null);
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== keys.me[0] });
    };
    window.addEventListener(SESSION_EXPIRED, expire);
    return () => window.removeEventListener(SESSION_EXPIRED, expire);
  }, [client]);
  if (me.isPending) return <div className="loading">Uruchamiam Studio…</div>;
  if (!me.data) return <Login onLogin={(user) => client.setQueryData(keys.me, user)} />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <SessionGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/grafiki" replace /> },
          { path: 'grafiki', element: <ProjectsPage /> },
          { path: 'grafiki/:id', element: <ProjectPage /> },
          { path: 'materialy', element: <AssetsPage /> },
          { path: 'marka', element: <BrandPage /> },
          { path: 'eksporty', element: <ExportsPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
