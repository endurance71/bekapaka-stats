import { useState, useEffect, useCallback } from 'react';
import { fetchJSON, postJSON, putJSON } from '../../lib/api';
import Modal from '../../components/Modal';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import SectionHeading from '../../shared/ui/SectionHeading';
import { Calendar, Plus, CheckCircle2, Archive, RefreshCw, Edit3, ArrowRight, ShieldAlert, Users, Layers } from 'lucide-react';

/** Digital 2.0: pole formularza — płaskie, linia ink-500, fokus 3 px złoty z global.css. */
const fieldClass =
  'w-full bg-bkpk-bg border border-bkpk-border-strong min-h-[48px] px-4 text-sm text-bkpk-text-primary placeholder:text-bkpk-text-muted hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors';
const fieldLabelClass = 'block label-caps text-xs text-bkpk-text-secondary mb-2';
const checkboxRowClass =
  'flex items-center gap-3 min-h-[48px] p-3 bg-bkpk-bg border border-bkpk-border-strong hover:border-bkpk-text-muted cursor-pointer transition-colors';
const checkboxClass = 'w-5 h-5 shrink-0 accent-bkpk-primary';

export interface SeasonWithStats {
  id: string;
  slug: string;
  label: string;
  divisionPath: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  bekapakaMatchesCount?: number;
  gamesCount: number;
  leagueMatchesCount: number;
  finishedMatchesCount: number;
  kalkPlayersCount: number;
  kalkTeamsCount: number;
}

interface RosterPlayerOption {
  id: string;
  firstName: string;
  lastName: string;
  number?: number | null;
  position?: string | null;
}

interface SeasonManagementProps {
  onSeasonChanged?: () => void;
}

export default function SeasonManagement({ onSeasonChanged }: SeasonManagementProps) {
  const [seasons, setSeasons] = useState<SeasonWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newLabel, setNewLabel] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDivisionPath, setNewDivisionPath] = useState('dzial,dywizja-2,4.html');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [activateNow, setActivateNow] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<RosterPlayerOption[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [resetGoals, setResetGoals] = useState(false);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Edit modal state
  const [editingSeason, setEditingSeason] = useState<SeasonWithStats | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDivisionPath, setEditDivisionPath] = useState('');
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Archive modal state
  const [archivingSeason, setArchivingSeason] = useState<SeasonWithStats | null>(null);
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<SeasonWithStats[]>('/api/admin/seasons');
      setSeasons(data);
      setError(null);
    } catch (err: any) {
      console.error('Błąd ładowania sezonów:', err);
      setError(err.message || 'Nie udało się pobrać listy sezonów');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const openNewSeasonWizard = async () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    setNewLabel(`Sezon ${currentYear}/${nextYear}`);
    setNewSlug(`${currentYear}-${nextYear}`);
    setNewDivisionPath('dzial,dywizja-2,4.html');
    setNewStartsAt(`${currentYear}-09-01`);
    setNewEndsAt(`${nextYear}-08-31`);
    setActivateNow(true);
    setResetGoals(false);
    setWizardStep(1);

    try {
      const players = await fetchJSON<RosterPlayerOption[]>('/api/players');
      setAvailablePlayers(players);
      setSelectedPlayerIds(players.map((p) => p.id));
    } catch (err) {
      console.warn('Nie udało się pobrać zawodników:', err);
    }

    setIsWizardOpen(true);
  };

  const handleCreateSeasonSubmit = async () => {
    setWizardSubmitting(true);
    try {
      // 1. Utwórz sezon
      const created = await postJSON<any>('/api/admin/seasons', {
        label: newLabel,
        slug: newSlug,
        divisionPath: newDivisionPath,
        startsAt: newStartsAt || null,
        endsAt: newEndsAt || null,
        activateNow
      });

      // 2. Wykonaj rollover kadry
      await postJSON('/api/admin/seasons/rollover', {
        targetSeasonId: created.id,
        activePlayerIds: selectedPlayerIds,
        resetGoals
      });

      setIsWizardOpen(false);
      await fetchSeasons();
      if (onSeasonChanged) onSeasonChanged();
      alert(`Sezon "${newLabel}" został pomyślnie utworzony i aktywowany!`);
    } catch (err: any) {
      alert(`Błąd: ${err.message || 'Nie udało się utworzyć sezonu'}`);
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleActivateSeason = async (season: SeasonWithStats) => {
    if (!window.confirm(`Czy na pewno chcesz ustawić "${season.label}" jako bieżący aktywny sezon?`)) {
      return;
    }
    try {
      await postJSON(`/api/admin/seasons/${season.id}/activate`, {});
      await fetchSeasons();
      if (onSeasonChanged) onSeasonChanged();
    } catch (err: any) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleArchiveSeasonSubmit = async () => {
    if (!archivingSeason) return;
    setArchiveSubmitting(true);
    try {
      await postJSON(`/api/admin/seasons/${archivingSeason.id}/archive`, {});
      setArchivingSeason(null);
      await fetchSeasons();
      if (onSeasonChanged) onSeasonChanged();
    } catch (err: any) {
      alert(`Błąd: ${err.message}`);
    } finally {
      setArchiveSubmitting(false);
    }
  };

  const handleArchiveAndOpenNewWizard = async () => {
    if (!archivingSeason) return;
    setArchiveSubmitting(true);
    try {
      await postJSON(`/api/admin/seasons/${archivingSeason.id}/archive`, {});
      setArchivingSeason(null);
      await fetchSeasons();
      if (onSeasonChanged) onSeasonChanged();
      await openNewSeasonWizard();
    } catch (err: any) {
      alert(`Błąd: ${err.message}`);
    } finally {
      setArchiveSubmitting(false);
    }
  };

  const openEditModal = (season: SeasonWithStats) => {
    setEditingSeason(season);
    setEditLabel(season.label);
    setEditDivisionPath(season.divisionPath);
    setEditStartsAt(season.startsAt ? season.startsAt.split('T')[0] : '');
    setEditEndsAt(season.endsAt ? season.endsAt.split('T')[0] : '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason) return;
    setEditSubmitting(true);
    try {
      await putJSON(`/api/admin/seasons/${editingSeason.id}`, {
        label: editLabel,
        divisionPath: editDivisionPath,
        startsAt: editStartsAt || null,
        endsAt: editEndsAt || null
      });
      setEditingSeason(null);
      await fetchSeasons();
      if (onSeasonChanged) onSeasonChanged();
    } catch (err: any) {
      alert(`Błąd: ${err.message}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  const togglePlayerSelection = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPlayers = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="min-w-0">
          <SectionHeading
            as="h3"
            title="Zarządzanie Sezonami i Archiwizacja"
          />
          <p className="text-sm text-bkpk-text-secondary mt-2 max-w-2xl">
            Konfiguracja aktywnego sezonu, zamykanie zakończonych rozgrywek oraz tworzenie nowego sezonu z transferem kadry.
          </p>
        </div>
        <BkpkButton variant="primary" onClick={openNewSeasonWizard} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Rozpocznij nowy sezon (Kreator)
        </BkpkButton>
      </div>

      {error && (
        <div className="p-4 bg-bkpk-surface border border-bkpk-border-subtle border-l-4 border-l-bkpk-danger text-bkpk-text-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-bkpk-text-muted text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-bkpk-text-primary" />
          Ładowanie sezonów...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              className={cn(
                'p-5 border space-y-4 transition-colors',
                season.isActive
                  ? 'bg-bkpk-surface border-bkpk-border-strong border-l-4 border-l-bkpk-primary'
                  : 'bg-bkpk-surface border-bkpk-border-subtle'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-[22px] leading-none uppercase text-bkpk-text-primary">{season.label}</h4>
                    {season.isActive ? (
                      <span className="status-flag gap-1 bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary">
                        <CheckCircle2 className="w-3 h-3" />
                        Bieżący (Aktywny)
                      </span>
                    ) : (
                      <span className="status-flag gap-1 text-bkpk-text-muted">
                        <Archive className="w-3 h-3" />
                        Archiwum
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-bkpk-text-muted font-mono mt-2 break-all">ID: {season.id} · Slug: {season.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(season)}
                  className="w-11 h-11 shrink-0 inline-flex items-center justify-center border border-bkpk-border-strong text-bkpk-text-secondary hover:text-bkpk-text-primary hover:border-bkpk-text-primary transition-colors"
                  title="Edytuj dane sezonu"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 border-y border-bkpk-border-subtle divide-x divide-bkpk-border-subtle text-center">
                <div className="py-3 px-1.5">
                  <span className="block label-caps text-[11px] text-bkpk-text-muted mb-1">Mecze BeKaPaKa</span>
                  <span className="font-display text-2xl leading-none tabular-nums text-bkpk-text-primary">{season.bekapakaMatchesCount ?? season.gamesCount}</span>
                </div>
                <div className="py-3 px-1.5">
                  <span className="block label-caps text-[11px] text-bkpk-text-muted mb-1">Mecze w lidze</span>
                  <span className="font-display text-2xl leading-none tabular-nums text-bkpk-text-primary">{season.finishedMatchesCount} / {season.leagueMatchesCount}</span>
                </div>
                <div className="py-3 px-1.5">
                  <span className="block label-caps text-[11px] text-bkpk-text-muted mb-1">Zawodnicy</span>
                  <span className="font-display text-2xl leading-none tabular-nums text-bkpk-text-primary">{season.kalkPlayersCount}</span>
                </div>
              </div>

              <div className="text-sm text-bkpk-text-secondary space-y-1">
                <p>
                  <span className="label-caps text-xs text-bkpk-text-muted">Dywizja KALK:</span> <code className="font-mono text-xs bg-bkpk-bg border border-bkpk-border-subtle px-1.5 py-0.5 text-bkpk-text-primary break-all">{season.divisionPath}</code>
                </p>
                <p>
                  <span className="label-caps text-xs text-bkpk-text-muted">Zakres dat:</span> {season.startsAt ? new Date(season.startsAt).toLocaleDateString() : '—'} do {season.endsAt ? new Date(season.endsAt).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-bkpk-border-subtle">
                {!season.isActive ? (
                  <BkpkButton
                    variant="outline"
                    onClick={() => handleActivateSeason(season)}
                    className="w-full"
                  >
                    Ustaw jako aktywny sezon
                  </BkpkButton>
                ) : (
                  <BkpkButton
                    variant="ghost"
                    onClick={() => setArchivingSeason(season)}
                    className="w-full"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                    Zakończ i zarchiwizuj sezon
                  </BkpkButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WIZARD NOWEGO SEZONU */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => !wizardSubmitting && setIsWizardOpen(false)}
        title="🚀 Kreator Nowego Sezonu"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Kroki */}
          <div className="flex items-center justify-between gap-1 border-b border-bkpk-border-strong pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center">
              <span className={cn('w-8 h-8 shrink-0 flex items-center justify-center font-display text-base tabular-nums border', wizardStep === 1 ? 'bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary' : 'border-bkpk-border-strong text-bkpk-text-muted')}>1</span>
              <span className={cn('label-caps text-[11px] sm:text-xs', wizardStep === 1 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Konfiguracja</span>
            </div>
            <div className="flex-1 min-w-3 mx-1 sm:mx-2 h-px bg-bkpk-border-strong" />
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center">
              <span className={cn('w-8 h-8 shrink-0 flex items-center justify-center font-display text-base tabular-nums border', wizardStep === 2 ? 'bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary' : 'border-bkpk-border-strong text-bkpk-text-muted')}>2</span>
              <span className={cn('label-caps text-[11px] sm:text-xs', wizardStep === 2 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Kadra drużyny</span>
            </div>
            <div className="flex-1 min-w-3 mx-1 sm:mx-2 h-px bg-bkpk-border-strong" />
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center">
              <span className={cn('w-8 h-8 shrink-0 flex items-center justify-center font-display text-base tabular-nums border', wizardStep === 3 ? 'bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary' : 'border-bkpk-border-strong text-bkpk-text-muted')}>3</span>
              <span className={cn('label-caps text-[11px] sm:text-xs', wizardStep === 3 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Podsumowanie</span>
            </div>
          </div>

          {/* Krok 1 */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={fieldLabelClass}>
                  Nazwa Sezonu (etykieta)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="np. Sezon 2026/2027"
                  className={fieldClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Identyfikator (slug)
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="np. 2026-2027"
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Ścieżka Dywizji KALK
                  </label>
                  <input
                    type="text"
                    value={newDivisionPath}
                    onChange={(e) => setNewDivisionPath(e.target.value)}
                    placeholder="dzial,dywizja-2,4.html"
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Data Rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Data Zakończenia
                  </label>
                  <input
                    type="date"
                    value={newEndsAt}
                    onChange={(e) => setNewEndsAt(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <label className={checkboxRowClass}>
                <input
                  type="checkbox"
                  checked={activateNow}
                  onChange={(e) => setActivateNow(e.target.checked)}
                  className={checkboxClass}
                />
                <span className="text-sm text-bkpk-text-primary">
                  Ustaw ten sezon natychmiast jako bieżący aktywny sezon
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-strong">
                <BkpkButton variant="ghost" onClick={() => setIsWizardOpen(false)}>Anuluj</BkpkButton>
                <BkpkButton
                  variant="primary"
                  onClick={() => {
                    if (!newLabel || !newSlug) {
                      alert('Wypełnij nazwę i slug sezonu.');
                      return;
                    }
                    setWizardStep(2);
                  }}
                >
                  Dalej: Skład Drużyny
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </BkpkButton>
              </div>
            </div>
          )}

          {/* Krok 2 */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="label-caps text-sm text-bkpk-text-primary">Wybierz zawodników na nowy sezon</p>
                  <p className="text-xs text-bkpk-text-secondary mt-1">Konta logowania i hasła wszystkich zawodników pozostają aktywne.</p>
                </div>
                <BkpkButton variant="ghost" size="sm" onClick={toggleSelectAllPlayers} className="shrink-0">
                  {selectedPlayerIds.length === availablePlayers.length ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                </BkpkButton>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {availablePlayers.map((player) => (
                  <label
                    key={player.id}
                    className={cn(
                      'flex items-center justify-between min-h-[48px] p-3 border transition-colors cursor-pointer',
                      selectedPlayerIds.includes(player.id)
                        ? 'bg-bkpk-bg border-bkpk-border-strong border-l-4 border-l-bkpk-primary'
                        : 'bg-bkpk-bg border-bkpk-border-subtle opacity-70 hover:border-bkpk-border-strong'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                        className={checkboxClass}
                      />
                      <span className="text-sm font-semibold text-bkpk-text-primary tabular-nums">
                        #{player.number ?? '—'} {player.firstName} {player.lastName}
                      </span>
                    </div>
                    {player.position && (
                      <span className="status-flag text-bkpk-text-muted">
                        {player.position}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <label className={checkboxRowClass}>
                <input
                  type="checkbox"
                  checked={resetGoals}
                  onChange={(e) => setResetGoals(e.target.checked)}
                  className={checkboxClass}
                />
                <span className="text-sm text-bkpk-text-primary">
                  Zresetuj cele osobiste zawodników na nowy sezon (rekomendowane)
                </span>
              </label>

              <div className="flex justify-between gap-3 pt-4 border-t border-bkpk-border-strong">
                <BkpkButton variant="ghost" onClick={() => setWizardStep(1)}>Wstecz</BkpkButton>
                <BkpkButton variant="primary" onClick={() => setWizardStep(3)}>
                  Dalej: Podsumowanie
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </BkpkButton>
              </div>
            </div>
          )}

          {/* Krok 3 */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-bkpk-bg border border-bkpk-border-strong text-sm">
                <div className="flex justify-between gap-4 py-2.5 border-b border-bkpk-border-subtle">
                  <span className="label-caps text-xs text-bkpk-text-muted">Nazwa sezonu:</span>
                  <span className="font-semibold text-right tabular-nums text-bkpk-text-primary">{newLabel}</span>
                </div>
                <div className="flex justify-between gap-4 py-2.5 border-b border-bkpk-border-subtle">
                  <span className="label-caps text-xs text-bkpk-text-muted">Identyfikator (ID):</span>
                  <span className="font-mono text-right break-all text-bkpk-text-primary">season_{newSlug}</span>
                </div>
                <div className="flex justify-between gap-4 py-2.5 border-b border-bkpk-border-subtle">
                  <span className="label-caps text-xs text-bkpk-text-muted">Ścieżka KALK:</span>
                  <span className="font-mono text-right break-all text-bkpk-text-primary">{newDivisionPath}</span>
                </div>
                <div className="flex justify-between gap-4 py-2.5 border-b border-bkpk-border-subtle">
                  <span className="label-caps text-xs text-bkpk-text-muted">Kadra zawodników:</span>
                  <span className="font-semibold text-right tabular-nums text-bkpk-text-primary">{selectedPlayerIds.length} z {availablePlayers.length} graczy</span>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <span className="label-caps text-xs text-bkpk-text-muted">Status po utworzeniu:</span>
                  <span className="font-semibold text-right text-bkpk-success">{activateNow ? 'Natychmiast aktywny' : 'Archiwalny'}</span>
                </div>
              </div>

              <p className="text-sm text-bkpk-text-secondary leading-relaxed">
                Po zatwierdzeniu system utworzy nowy sezon, przeniesie kadrę i ustawi nowy sezon jako domyślny. Następnie będzie można uruchomić pierwszy scraping KALK, aby pobrać nowy terminarz i tabelę.
              </p>

              <div className="flex justify-between gap-3 pt-4 border-t border-bkpk-border-strong">
                <BkpkButton variant="ghost" onClick={() => setWizardStep(2)} disabled={wizardSubmitting}>
                  Wstecz
                </BkpkButton>
                <BkpkButton variant="primary" onClick={handleCreateSeasonSubmit} disabled={wizardSubmitting}>
                  {wizardSubmitting ? 'Tworzenie sezonu...' : 'Zatwierdź i rozpocznij sezon'}
                </BkpkButton>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL EDYCJI SEZONU */}
      {editingSeason && (
        <Modal
          isOpen={Boolean(editingSeason)}
          onClose={() => !editSubmitting && setEditingSeason(null)}
          title="✏️ Edycja Danych Sezonu"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className={fieldLabelClass}>
                Nazwa Sezonu
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className={fieldLabelClass}>
                Ścieżka Dywizji KALK
              </label>
              <input
                type="text"
                value={editDivisionPath}
                onChange={(e) => setEditDivisionPath(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={fieldLabelClass}>
                  Data Rozpoczęcia
                </label>
                <input
                  type="date"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>
                  Data Zakończenia
                </label>
                <input
                  type="date"
                  value={editEndsAt}
                  onChange={(e) => setEditEndsAt(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-strong">
              <BkpkButton variant="ghost" type="button" onClick={() => setEditingSeason(null)} disabled={editSubmitting}>
                Anuluj
              </BkpkButton>
              <BkpkButton variant="primary" type="submit" disabled={editSubmitting}>
                {editSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </BkpkButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL ZAMKNIĘCIA SEZONU */}
      {archivingSeason && (
        <Modal
          isOpen={Boolean(archivingSeason)}
          onClose={() => !archiveSubmitting && setArchivingSeason(null)}
          title="📦 Zamknięcie i Archiwizacja Sezonu"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-bkpk-bg border border-bkpk-border-subtle border-l-4 border-l-bkpk-danger text-bkpk-text-danger flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="label-caps text-xs">Potwierdzenie zakończenia sezonu</p>
                <p className="text-bkpk-text-secondary leading-relaxed">
                  Zamknięcie sezonu <strong>{archivingSeason.label}</strong> zamrozi jego statystyki i oznaczy go jako archiwalny. Wszystkie mecze, protokoły i dane zawodników pozostaną nienaruszone w bazie.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-bkpk-border-strong">
              <BkpkButton variant="ghost" onClick={() => setArchivingSeason(null)} disabled={archiveSubmitting}>
                Anuluj
              </BkpkButton>
              <BkpkButton variant="outline" onClick={handleArchiveSeasonSubmit} disabled={archiveSubmitting}>
                {archiveSubmitting ? 'Zamykanie...' : 'Tylko zamknij sezon'}
              </BkpkButton>
              <BkpkButton variant="primary" onClick={handleArchiveAndOpenNewWizard} disabled={archiveSubmitting}>
                {archiveSubmitting ? 'Zamykanie...' : 'Zamknij i utwórz kolejny sezon'}
              </BkpkButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
