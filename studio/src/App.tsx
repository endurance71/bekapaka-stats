import PostCatalog from './PostCatalog';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Plus, LayoutGrid, Image, Download, ShieldCheck, LogOut, ArrowLeft, Layers, RefreshCw } from 'lucide-react';
import { api, send, fileUrl } from './api';
import { newPostProject } from '../../backend/studio/contracts.js';
import type { View, Template, Asset, Partner, Budget, Output, PostType } from './types';
import Editor from './Editor';
import Library from './Library';
import { ArchivedExportImages } from './ExportFile';
export default function App() {
  const [user, setUser] = useState<{ firstName: string } | null>(null); const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('projects'); const [projects, setProjects] = useState<View[]>([]); const [templates, setTemplates] = useState<Template[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]); const [partners, setPartners] = useState<Partner[]>([]); const [budget, setBudget] = useState<Budget | null>(null);
  const [editor, setEditor] = useState<View | null>(null); const [error, setError] = useState(''); const [newOpen, setNewOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [posts,setPosts]=useState<PostType[]>([]);
  const [exports, setExports] = useState<{ id: string; jobId: string; revision: number; files: Output[]; project: { name: string }; expiresAt: string; createdAt: string }[]>([]);
  async function load() {
    try {
      const [p, t, a, s, b, e] = await Promise.all([api<View[]>('/projects'), api<{ templates: Template[]; postTypes:PostType[] }>('/templates'), api<Asset[]>('/assets'), api<Partner[]>('/partners'), api<Budget>('/ai/budget'), api<typeof exports>('/exports')]);
      setPosts(t.postTypes || []); setProjects(p); setTemplates(t.templates.map(x => ({ ...x, id: x.family || x.id }))); setAssets(a); setPartners(s); setBudget(b); setExports(e);
    } catch (err) { setError((err as Error).message); }
  }
  useEffect(() => { api<{ user: { firstName: string } }>('/auth/me').then(v => setUser(v.user)).catch(() => {}).finally(() => setChecking(false)); const expire = () => { setUser(null); setEditor(null); }; window.addEventListener('studio-session-expired', expire); return () => window.removeEventListener('studio-session-expired', expire); }, []);
  useEffect(() => { if (user) void load(); }, [user]);
  async function open(id: string) { setBusy(true); try { setEditor(await api<View>(`/projects/${id}`)); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }
  async function create(postType: string, style: string) { setBusy(true); try { const v = await send<View>('/projects', newPostProject(postType,style)); setEditor(v); setNewOpen(false); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }
  if (checking) return <div className="loading">Uruchamiam Studio…</div>;
  if (!user) return <Login onLogin={setUser}/>;
  return <div className="app">
    <aside className="sidebar"><button className="brand" onClick={() => { if (!editor) setTab('projects'); }} aria-label="BeKaPaKa Studio"><img src="/brand/sygnet2-kolor.svg" alt=""/><span>BEKAPAKA<b>STUDIO</b></span></button><span className="workspace-label">PRACOWNIA KLUBU</span>
      <nav>{[['projects', 'Projekty', LayoutGrid], ['assets', 'Materiały', Image], ['exports', 'Eksporty', Download], ['brand', 'Marka i partnerzy', ShieldCheck]].map(([id, label, Icon]) => { const I = Icon as typeof LayoutGrid; return <button key={id as string} className={tab === id ? 'nav-item active' : 'nav-item'} disabled={!!editor} onClick={() => setTab(id as string)}><I size={19}/><span>{label as string}</span>{id === 'projects' && <small>{projects.length}</small>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="brand-version"><i/>SYSTEM 2.0 <span>03.10.26</span></div><div className="account"><div className="avatar">{user.firstName?.[0] || 'B'}</div><div>{user.firstName}<small>Właściciel Studio</small></div><button className="icon-button" title="Wyloguj" aria-label="Wyloguj" disabled={!!editor} onClick={async () => { await send('/auth/logout', {}); setUser(null); }}><LogOut size={17}/></button></div></div>
    </aside>
    <main className={editor ? 'main editor-main' : 'main'}>
      {error && <div role="alert" className="error-banner">{error}<button onClick={() => setError('')}>Zamknij</button></div>}
      {editor ? <Editor posts={posts} initial={editor} templates={templates} assets={assets} partners={partners} budget={budget} reloadLibrary={load} onClose={() => { setEditor(null); void load(); }} onDuplicate={async () => { const v = await send<View>(`/projects/${editor.id}/duplicate`, {}); setEditor(v); }} key={editor.id}/> : <>
        <header className="page-header"><div><span className="eyebrow">BEKAPAKA / PRACOWNIA</span><h1>{({ projects: 'Twoje projekty', assets: 'Biblioteka materiałów', exports: 'Gotowe do publikacji', brand: 'System marki 2.0' } as Record<string, string>)[tab]}</h1></div><div className="header-actions"><button className="icon-button" aria-label="Odśwież" onClick={load}><RefreshCw size={18}/></button><button className="primary" disabled={busy} onClick={() => setNewOpen(true)}><Plus size={18}/>Nowy projekt</button></div></header>
        {tab === 'projects' && <><section className="welcome"><div><span className="eyebrow light">JEDEN KLUB. WSPÓLNY RYTM.</span><h2>Z PARKIETU.<br/>NA TWÓJ FEED.</h2><p>Wybierz mecz. Dodaj prawdziwe zdjęcia.<br/>Pobierz materiał w barwach BeKaPaKa.</p><button onClick={() => setNewOpen(true)}>Utwórz materiał <ArrowUpRight size={20}/></button></div><img src="/brand/herb2-kolor.svg" alt="Znak BeKaPaKa 2.0"/><div className="hero-stripes"/></section>
          <div className="section-title"><h2>Ostatnie projekty <span>{projects.length}</span></h2><span className="muted">Rytm Twoich publikacji</span></div>
          {!projects.length ? <div className="empty"><Layers size={30}/><h3>Tu zaczyna się Twoja publikacja</h3><p>Zapowiedź, wynik, MVP albo historia meczu.<br/>Wybierz rodzinę, a Studio zajmie się układem.</p><button className="secondary" onClick={() => setNewOpen(true)}>Wybierz szablon <ArrowUpRight size={16}/></button></div> : <div className="project-grid">{projects.map((p, i) => <button className="project-card" data-project-id={p.id} key={p.id} onClick={() => open(p.id)} disabled={busy}><div className={`project-cover cover-${p.family}`}>
            {p.jobs?.[0]?.result?.files?.[0] && new Date(p.jobs[0].result.expiresAt || 0) > new Date() ? <img src={fileUrl(p.jobs[0].id, p.jobs[0].result.files[0].key)} alt="Podgląd projektu"/> : <><span className="cover-index">{String(i + 1).padStart(2, '0')}</span><img src="/brand/sygnet2-kolor.svg" alt=""/><strong>{templates.find(t => t.id === p.family)?.label || p.family}</strong><div className="mini-stripes"/></>}
          </div><div className="project-info"><h3>{p.name}</h3><span>{p.status === 'archived' ? 'Archiwum' : 'Projekt roboczy'} · {new Date(p.updatedAt).toLocaleDateString('pl-PL')}</span><ArrowUpRight size={18}/></div></button>)}</div>}
          <div className="studio-note"><ShieldCheck size={20}/><p>Marka pilnuje układu. Ty decydujesz o treści.<span>Chronione znaki, fonty i geometria. Każdy eksport z kontrolą danych i materiałów.</span></p></div></>}
        {(tab === 'assets' || tab === 'brand') && <Library posts={posts} tab={tab} assets={assets} partners={partners} templates={templates} reload={load} onError={setError}/>}
        {tab === 'exports' && <div className="export-list">{!exports.length && <div className="empty"><Download/><h3>Paczki pojawią się po eksporcie</h3><p>PNG, opis posta i manifest w jednym ZIP.</p></div>}{exports.map(e => <div className="export-row" key={e.id}><Download/><div><h3>{e.project.name}</h3><span>Rewizja {e.revision} · {new Date(e.createdAt).toLocaleString('pl-PL')}</span>{new Date(e.expiresAt) > new Date() && <ArchivedExportImages jobId={e.jobId} files={e.files || []} onError={setError}/>}</div>{new Date(e.expiresAt) > new Date() ? <a className="secondary" href={fileUrl(e.jobId, 'zip', true)}>Pobierz ZIP</a> : <span className="muted">Wygasł — otwórz projekt i eksportuj ponownie</span>}</div>)}</div>}
      </>}
    </main>
    {newOpen && <div className="modal-backdrop" onClick={() => setNewOpen(false)}><section className="modal template-modal" role="dialog" aria-modal="true" aria-labelledby="new-title" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">NOWY PROJEKT</span><h2 id="new-title">Co dziś publikujemy?</h2></div><button className="icon-button" aria-label="Zamknij" onClick={() => setNewOpen(false)}>×</button></div><PostCatalog posts={posts} busy={busy} onCreate={create}/></section></div>}
  </div>;
}
function Login({ onLogin }: { onLogin: (u: { firstName: string }) => void }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <main className="login"><div className="login-art"><img src="/brand/herb2-kolor.svg" alt="BeKaPaKa Bobolice"/><h1>NASZ KLUB.<br/>NASZ OBRAZ.</h1><div className="hero-stripes"/></div><section className="login-form"><span className="eyebrow">BEKAPAKA STUDIO / SYSTEM 2.0</span><h2>Wracamy do gry.</h2><p>Prywatna pracownia grafik BeKaPaKa.<br/>Zaloguj się swoim kontem klubowym.</p><form onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); const f = new FormData(e.currentTarget); try { const v = await send<{ user: { firstName: string } }>('/auth/login', { username: f.get('username'), password: f.get('password') }); onLogin(v.user); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}><label>Login<input name="username" autoComplete="username" required maxLength={100}/></label><label>Hasło<input name="password" type="password" autoComplete="current-password" required maxLength={200}/></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Logowanie…' : 'Otwórz Studio'}<ArrowUpRight size={18}/></button></form><small>Eksportujesz pliki. Publikujesz po swojemu.</small></section></main>;
}
