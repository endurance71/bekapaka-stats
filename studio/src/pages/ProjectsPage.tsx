import { Link } from 'react-router';
import { ArrowUpRight, Layers, ShieldCheck } from 'lucide-react';
import { fileUrl } from '../lib/api';
import { useCatalog, useProjects } from '../lib/queries';
import type { View } from '../lib/types';
import PageHeader from '../components/PageHeader';
import { useShell } from '../app/shell-context';

function Cover({ project, index, label }: { project: View; index: number; label: string }) {
  const job = project.jobs?.[0];
  const file = job?.result?.files?.[0];
  // Previews expire after 24 h; an expired cover falls back to the brand placeholder.
  if (job && file && new Date(job.result?.expiresAt || 0) > new Date())
    return <img src={fileUrl(job.id, file.key)} alt="Podgląd projektu" />;
  return (
    <>
      <span className="cover-index">{String(index + 1).padStart(2, '0')}</span>
      <img src="/brand/sygnet2-kolor.svg" alt="" />
      <strong>{label}</strong>
      <div className="mini-stripes" />
    </>
  );
}

export default function ProjectsPage() {
  const { openNew } = useShell();
  const projects = useProjects();
  const catalog = useCatalog();
  const list = projects.data || [];
  const label = (p: View) =>
    catalog.data?.posts.find((t) => t.id === p.payload?.postType)?.label ||
    catalog.data?.templates.find((t) => t.id === p.family)?.label ||
    p.family;
  return (
    <>
      <PageHeader title="Twoje grafiki" />
      <section className="welcome">
        <div>
          <span className="eyebrow light">JEDEN KLUB. WSPÓLNY RYTM.</span>
          <h2>
            Z PARKIETU.
            <br />
            NA TWÓJ FEED.
          </h2>
          <p>
            Wybierz mecz. Dodaj prawdziwe zdjęcia.
            <br />
            Pobierz materiał w barwach BeKaPaKa.
          </p>
          <button onClick={openNew}>
            Utwórz materiał <ArrowUpRight size={20} />
          </button>
        </div>
        <img src="/brand/herb2-kolor.svg" alt="Znak BeKaPaKa 2.0" />
        <div className="hero-stripes" />
      </section>
      <div className="section-title">
        <h2>
          Ostatnie projekty <span>{list.length}</span>
        </h2>
        <span className="muted">Rytm Twoich publikacji</span>
      </div>
      {projects.isError && (
        <p role="alert" className="form-error">
          Nie udało się wczytać projektów: {projects.error.message}
        </p>
      )}
      {projects.isPending ? (
        <p className="muted">Wczytuję projekty…</p>
      ) : !list.length ? (
        <div className="empty">
          <Layers size={30} />
          <h3>Tu zaczyna się Twoja publikacja</h3>
          <p>
            Zapowiedź, wynik, MVP albo historia meczu.
            <br />
            Wybierz rodzinę, a Studio zajmie się układem.
          </p>
          <button className="secondary" onClick={openNew}>
            Wybierz szablon <ArrowUpRight size={16} />
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {list.map((p, i) => (
            <Link className="project-card" data-project-id={p.id} key={p.id} to={`/grafiki/${p.id}`}>
              <div className={`project-cover cover-${p.family}`}>
                <Cover project={p} index={i} label={label(p)} />
              </div>
              <div className="project-info">
                <h3>{p.name}</h3>
                <span>
                  {p.status === 'archived' ? 'Archiwum' : 'Projekt roboczy'} ·{' '}
                  {new Date(p.updatedAt).toLocaleDateString('pl-PL')}
                </span>
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="studio-note">
        <ShieldCheck size={20} />
        <p>
          Marka pilnuje układu. Ty decydujesz o treści.
          <span>Chronione znaki, fonty i geometria. Każdy eksport z kontrolą danych i materiałów.</span>
        </p>
      </div>
    </>
  );
}
