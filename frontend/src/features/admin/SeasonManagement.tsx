import { useState, useEffect, useCallback } from 'react';
import { fetchJSON, postJSON, putJSON } from '../../lib/api';
import Modal from '../../components/Modal';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import { Calendar, Plus, CheckCircle2, Archive, RefreshCw, Edit3, ArrowRight, ShieldAlert, Users, Layers } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-bkpk-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-bkpk-primary" />
            Zarządzanie Sezonami i Archiwizacja
          </h3>
          <p className="text-xs sm:text-sm text-bkpk-text-muted mt-1">
            Konfiguracja aktywnego sezonu, zamykanie zakończonych rozgrywek oraz tworzenie nowego sezonu z transferem kadry.
          </p>
        </div>
        <BkpkButton variant="primary" onClick={openNewSeasonWizard} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Rozpocznij nowy sezon (Kreator)
        </BkpkButton>
      </div>

      {error && (
        <div className="p-4 bg-bkpk-danger/10 border border-bkpk-danger/30 rounded-xl text-bkpk-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-bkpk-text-muted text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-bkpk-primary" />
          Ładowanie sezonów...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              className={cn(
                'p-5 rounded-2xl border transition-all space-y-4',
                season.isActive
                  ? 'bg-bkpk-surface border-bkpk-primary/50 shadow-bkpk-glow'
                  : 'bg-bkpk-surface-tint-2 border-bkpk-border-subtle opacity-90'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-bold text-bkpk-text-primary">{season.label}</h4>
                    {season.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-bkpk-primary/20 text-bkpk-primary border border-bkpk-primary/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Bieżący (Aktywny)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bkpk-text-muted/20 text-bkpk-text-muted border border-bkpk-border-subtle flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archiwum
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-bkpk-text-muted font-mono mt-1">ID: {season.id} · Slug: {season.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(season)}
                  className="p-2 text-bkpk-text-muted hover:text-bkpk-text-primary rounded-lg hover:bg-bkpk-surface transition-colors"
                  title="Edytuj dane sezonu"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-bkpk-overlay-medium rounded-xl border border-bkpk-border-subtle text-center text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-bkpk-text-muted">Mecze BeKaPaKa</span>
                  <span className="text-sm font-black text-bkpk-primary">{season.bekapakaMatchesCount ?? season.gamesCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-bkpk-text-muted">Mecze w lidze</span>
                  <span className="text-sm font-black text-bkpk-text-primary">{season.finishedMatchesCount} / {season.leagueMatchesCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-bkpk-text-muted">Zawodnicy</span>
                  <span className="text-sm font-black text-bkpk-text-primary">{season.kalkPlayersCount}</span>
                </div>
              </div>

              <div className="text-xs text-bkpk-text-secondary space-y-1">
                <p>
                  <span className="text-bkpk-text-muted">Dywizja KALK:</span> <code className="font-mono bg-bkpk-surface px-1.5 py-0.5 rounded text-bkpk-primary">{season.divisionPath}</code>
                </p>
                <p>
                  <span className="text-bkpk-text-muted">Zakres dat:</span> {season.startsAt ? new Date(season.startsAt).toLocaleDateString() : '—'} do {season.endsAt ? new Date(season.endsAt).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-bkpk-border-subtle">
                {!season.isActive ? (
                  <BkpkButton
                    variant="outline"
                    onClick={() => handleActivateSeason(season)}
                    className="w-full text-xs"
                  >
                    Ustaw jako aktywny sezon
                  </BkpkButton>
                ) : (
                  <BkpkButton
                    variant="ghost"
                    onClick={() => setArchivingSeason(season)}
                    className="w-full text-xs text-bkpk-warning hover:bg-bkpk-warning/10"
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
          <div className="flex items-center justify-between border-b border-bkpk-border-strong pb-4">
            <div className="flex items-center gap-2">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-black', wizardStep === 1 ? 'bg-bkpk-primary text-black' : 'bg-bkpk-surface-tint-2 text-bkpk-text-muted')}>1</span>
              <span className={cn('text-xs font-bold', wizardStep === 1 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Konfiguracja</span>
            </div>
            <div className="w-8 h-px bg-bkpk-border-strong" />
            <div className="flex items-center gap-2">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-black', wizardStep === 2 ? 'bg-bkpk-primary text-black' : 'bg-bkpk-surface-tint-2 text-bkpk-text-muted')}>2</span>
              <span className={cn('text-xs font-bold', wizardStep === 2 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Kadra drużyny</span>
            </div>
            <div className="w-8 h-px bg-bkpk-border-strong" />
            <div className="flex items-center gap-2">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-black', wizardStep === 3 ? 'bg-bkpk-primary text-black' : 'bg-bkpk-surface-tint-2 text-bkpk-text-muted')}>3</span>
              <span className={cn('text-xs font-bold', wizardStep === 3 ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted')}>Podsumowanie</span>
            </div>
          </div>

          {/* Krok 1 */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                  Nazwa Sezonu (etykieta)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="np. Sezon 2026/2027"
                  className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                    Identyfikator (slug)
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="np. 2026-2027"
                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                    Ścieżka Dywizji KALK
                  </label>
                  <input
                    type="text"
                    value={newDivisionPath}
                    onChange={(e) => setNewDivisionPath(e.target.value)}
                    placeholder="dzial,dywizja-2,4.html"
                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                    Data Rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                    Data Zakończenia
                  </label>
                  <input
                    type="date"
                    value={newEndsAt}
                    onChange={(e) => setNewEndsAt(e.target.value)}
                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateNow}
                  onChange={(e) => setActivateNow(e.target.checked)}
                  className="w-4 h-4 rounded text-bkpk-primary focus:ring-bkpk-primary"
                />
                <span className="text-xs text-bkpk-text-primary font-medium">
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-bkpk-text-primary">Wybierz zawodników na nowy sezon</p>
                  <p className="text-xs text-bkpk-text-muted">Konta logowania i hasła wszystkich zawodników pozostają aktywne.</p>
                </div>
                <BkpkButton variant="ghost" onClick={toggleSelectAllPlayers} className="text-xs">
                  {selectedPlayerIds.length === availablePlayers.length ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                </BkpkButton>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {availablePlayers.map((player) => (
                  <label
                    key={player.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer',
                      selectedPlayerIds.includes(player.id)
                        ? 'bg-bkpk-primary/10 border-bkpk-primary/40'
                        : 'bg-bkpk-surface-tint-2 border-bkpk-border-subtle opacity-70'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                        className="w-4 h-4 rounded text-bkpk-primary focus:ring-bkpk-primary"
                      />
                      <span className="text-xs font-bold text-bkpk-text-primary">
                        #{player.number ?? '—'} {player.firstName} {player.lastName}
                      </span>
                    </div>
                    {player.position && (
                      <span className="text-[10px] font-mono font-bold bg-bkpk-surface px-2 py-0.5 rounded text-bkpk-text-muted">
                        {player.position}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-3 p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetGoals}
                  onChange={(e) => setResetGoals(e.target.checked)}
                  className="w-4 h-4 rounded text-bkpk-primary focus:ring-bkpk-primary"
                />
                <span className="text-xs text-bkpk-text-primary font-medium">
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
              <div className="p-4 bg-bkpk-surface-tint-2 rounded-2xl border border-bkpk-border-strong space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-bkpk-border-subtle">
                  <span className="text-bkpk-text-muted">Nazwa sezonu:</span>
                  <span className="font-bold text-bkpk-text-primary">{newLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-bkpk-border-subtle">
                  <span className="text-bkpk-text-muted">Identyfikator (ID):</span>
                  <span className="font-mono text-bkpk-text-primary">season_{newSlug}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-bkpk-border-subtle">
                  <span className="text-bkpk-text-muted">Ścieżka KALK:</span>
                  <span className="font-mono text-bkpk-primary">{newDivisionPath}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-bkpk-border-subtle">
                  <span className="text-bkpk-text-muted">Kadra zawodników:</span>
                  <span className="font-bold text-bkpk-text-primary">{selectedPlayerIds.length} z {availablePlayers.length} graczy</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-bkpk-text-muted">Status po utworzeniu:</span>
                  <span className="font-bold text-bkpk-success">{activateNow ? 'Natychmiast aktywny' : 'Archiwalny'}</span>
                </div>
              </div>

              <p className="text-xs text-bkpk-text-secondary leading-relaxed">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                Nazwa Sezonu
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                Ścieżka Dywizji KALK
              </label>
              <input
                type="text"
                value={editDivisionPath}
                onChange={(e) => setEditDivisionPath(e.target.value)}
                className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                  Data Rozpoczęcia
                </label>
                <input
                  type="date"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-bkpk-text-muted mb-1.5">
                  Data Zakończenia
                </label>
                <input
                  type="date"
                  value={editEndsAt}
                  onChange={(e) => setEditEndsAt(e.target.value)}
                  className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
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
            <div className="p-4 bg-bkpk-warning/10 border border-bkpk-warning/30 rounded-xl text-bkpk-warning flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold uppercase tracking-wider">Potwierdzenie zakończenia sezonu</p>
                <p className="text-bkpk-text-secondary leading-relaxed">
                  Zamknięcie sezonu <strong>{archivingSeason.label}</strong> zamrozi jego statystyki i oznaczy go jako archiwalny. Wszystkie mecze, protokoły i dane zawodników pozostaną nienaruszone w bazie.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-strong">
              <BkpkButton variant="ghost" onClick={() => setArchivingSeason(null)} disabled={archiveSubmitting}>
                Anuluj
              </BkpkButton>
              <BkpkButton variant="primary" onClick={handleArchiveSeasonSubmit} disabled={archiveSubmitting}>
                {archiveSubmitting ? 'Zamykanie...' : 'Potwierdzam, zamknij sezon'}
              </BkpkButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
