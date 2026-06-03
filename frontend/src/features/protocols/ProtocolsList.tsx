import type { Game } from './types';

interface ProtocolsListProps {
  games: Game[];
  onView: (game: Game) => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
  onAddEmpty: () => void;
  onShowImport: () => void;
}

export default function ProtocolsList({
  games,
  onView,
  onEdit,
  onDelete,
  onAddEmpty,
  onShowImport,
}: ProtocolsListProps) {
  return (
    <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary">Lista protokołów</h3>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-sm font-bold rounded-xl hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
            onClick={onAddEmpty}
          >
            Dodaj pusty protokół
          </button>
          <button
            className="px-4 py-2 bg-bkpk-primary text-bkpk-on-primary text-sm font-bold rounded-xl hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary"
            onClick={onShowImport}
          >
            Dodaj protokół
          </button>
        </div>
      </div>
      <div className="grid gap-3">
        {games.map((game) => (
          <div key={game.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl p-4 hover:border-bkpk-primary/30 transition-colors">
            <div>
              <div className="font-bold text-bkpk-text-primary text-lg">
                {game.teams.find((t) => !t.isBekapaka)?.name || 'Rywal'}
              </div>
              <div className="text-bkpk-text-muted text-xs font-medium uppercase tracking-wider mt-1">
                {game.date} · <span className="text-bkpk-text-secondary">{game.finalScore}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => onView(game)}
              >
                Podgląd
              </button>
              <button
                className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => onEdit(game)}
              >
                Edytuj
              </button>
              <button
                className="bg-bkpk-danger/15 text-bkpk-text-danger-subtle border border-bkpk-danger/20 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-bkpk-danger/20 transition-colors"
                onClick={() => onDelete(game.id)}
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && (
          <div className="p-8 text-center text-bkpk-text-muted italic border-2 border-dashed border-bkpk-border-subtle rounded-xl">
            Brak protokołów. Dodaj pierwszy protokół powyżej.
          </div>
        )}
      </div>
    </div>
  );
}
