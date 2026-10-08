import { useMemo, useState } from 'react';
import { NavLink, Outlet, useMatch, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookText,
  CalendarDays,
  Download,
  Home,
  Image,
  LayoutGrid,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { message, send } from '../lib/api';
import { keys, useCatalog, useProjects } from '../lib/queries';
import { newPostProject } from '../lib/contracts';
import { brandDate } from '../lib/brand';
import type { User, View } from '../lib/types';
import Modal from '../components/Modal';
import PostCatalog from '../features/catalog/PostCatalog';
import NewPublicationModal, { type NewPublicationPrefill } from '../features/publications/NewPublicationModal';
import { ShellContext } from './shell-context';

const nav = [
  ['/', 'Pulpit', Home],
  ['/kalendarz', 'Kalendarz', CalendarDays],
  ['/publikacje', 'Publikacje', Megaphone],
  ['/grafiki', 'Grafiki', LayoutGrid],
  ['/materialy', 'Materiały', Image],
  ['/eksporty', 'Eksporty', Download],
  ['/marka', 'Marka i partnerzy', ShieldCheck],
  ['/prompty', 'Schematy i prompty', BookText],
  ['/ustawienia', 'Ustawienia', Settings],
] as const;

export default function AppShell() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const user = client.getQueryData<User>(keys.me);
  const graphicRoute = useMatch('/grafiki/:id');
  const publicationRoute = useMatch('/publikacje/:id/*');
  const editing = !!graphicRoute || !!publicationRoute;
  const catalog = useCatalog();
  const projects = useProjects();
  const [error, setError] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newPublication, setNewPublication] = useState<NewPublicationPrefill | null>(null);
  const shell = useMemo(
    () => ({
      openNew: () => setNewOpen(true),
      openNewPublication: (p?: NewPublicationPrefill) => setNewPublication(p || {}),
      setError,
    }),
    [],
  );

  async function create(postType: string, style: string) {
    setBusy(true);
    try {
      const v = await send<View>('/projects', newPostProject(postType, style));
      void client.invalidateQueries({ queryKey: keys.projects });
      setNewOpen(false);
      navigate(`/grafiki/${v.id}`);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await send('/auth/logout', {});
    } catch {
      // The session is dropped locally even if the server already forgot it.
    }
    client.setQueryData(keys.me, null);
    client.removeQueries({ predicate: (q) => q.queryKey[0] !== keys.me[0] });
  }

  return (
    <ShellContext.Provider value={shell}>
      <div className="app">
        <aside className="sidebar">
          <NavLink className="brand" to="/" aria-label="BeKaPaKa Studio">
            <img src="/brand/sygnet2-kolor.svg" alt="" />
            <span>
              BEKAPAKA<b>STUDIO</b>
            </span>
          </NavLink>
          <span className="workspace-label">PRACOWNIA KLUBU</span>
          <nav>
            {nav.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                <Icon size={19} />
                <span>{label}</span>
                {to === '/grafiki' && projects.data && <small>{projects.data.length}</small>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="brand-version">
              <i />
              SYSTEM 2.0 <span>{brandDate(catalog.data?.brandVersion)}</span>
            </div>
            <div className="account">
              <div className="avatar">{user?.firstName?.[0] || 'B'}</div>
              <div>
                {user?.firstName}
                <small>Właściciel Studio</small>
              </div>
              <button className="icon-button" title="Wyloguj" aria-label="Wyloguj" onClick={() => void logout()}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </aside>
        <main className={editing ? 'main editor-main' : 'main'}>
          {error && (
            <div role="alert" className="error-banner">
              {error}
              <button onClick={() => setError('')}>Zamknij</button>
            </div>
          )}
          <Outlet />
        </main>
        {newPublication && <NewPublicationModal prefill={newPublication} onClose={() => setNewPublication(null)} />}
        {newOpen && (
          <Modal
            eyebrow="NOWY PROJEKT"
            title="Co dziś publikujemy?"
            className="template-modal"
            onClose={() => setNewOpen(false)}
          >
            <PostCatalog posts={catalog.data?.posts || []} busy={busy} onCreate={create} />
          </Modal>
        )}
      </div>
    </ShellContext.Provider>
  );
}
