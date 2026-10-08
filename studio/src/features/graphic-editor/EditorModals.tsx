import { Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import type { Content, Job, Project, Snapshot } from '../../lib/types';

export function ApprovalModal({
  revision,
  busy,
  disabled,
  onCancel,
  onConfirm,
}: {
  revision: number;
  busy: boolean;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={`Potwierdź rewizję ${revision}`} onClose={onCancel} dismissible={false}>
      <p>
        Sprawdziłem datę, godzinę, miejsce, rywala, wynik i nazwiska. Podgląd każdego wybranego formatu odpowiada
        zamierzonej publikacji. Korekty danych pozostają w Studio.
      </p>
      <p className="muted">Każda kolejna zmiana będzie wymagała nowego potwierdzenia.</p>
      <div className="modal-actions">
        <button className="secondary" onClick={onCancel}>
          Wróć do edycji
        </button>
        <button className="primary" disabled={busy || disabled} onClick={onConfirm}>
          Potwierdzam
        </button>
      </div>
    </Modal>
  );
}

export function HistoryModal({
  history,
  current,
  readonly,
  onRestore,
  onClose,
}: {
  history: { number: number; payload: Project; createdAt: string }[];
  current: number;
  readonly: boolean;
  onRestore: (payload: Project) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Historia projektu" onClose={onClose}>
      {history.map((r) => (
        <div className="history-row" key={r.number}>
          <span>
            Rewizja {r.number}
            <small>{new Date(r.createdAt).toLocaleString('pl-PL')}</small>
          </span>
          <button
            className="secondary"
            disabled={readonly || r.number === current}
            onClick={() => onRestore(r.payload)}
          >
            Przywróć jako nową rewizję
          </button>
        </div>
      ))}
    </Modal>
  );
}

export function SourceDiffModal({
  diff,
  content,
  onKeep,
  onApply,
}: {
  diff: Snapshot;
  content: Content;
  onKeep: () => void;
  onApply: () => void;
}) {
  const current = content as Record<string, unknown>;
  const rows = Object.entries(diff.data).filter(
    ([k, v]) => k in current && JSON.stringify(v) !== JSON.stringify(current[k]),
  );
  return (
    <Modal title="Źródło zostało zaktualizowane" onClose={onKeep} dismissible={false}>
      <p>Sprawdź różnice przed zastąpieniem danych w projekcie.</p>
      <table>
        <thead>
          <tr>
            <th>Pole</th>
            <th>Projekt</th>
            <th>Aktualne źródło</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{typeof current[k] === 'object' ? JSON.stringify(current[k]) : String(current[k] ?? '')}</td>
              <td>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-actions">
        <button className="secondary" onClick={onKeep}>
          Zachowaj projekt
        </button>
        <button className="primary" onClick={onApply}>
          Zastosuj aktualne dane
        </button>
      </div>
    </Modal>
  );
}

export function AiResultModal({
  job,
  stale,
  onApply,
  onClose,
}: {
  job: Job;
  stale: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  const r = job.result || {};
  return (
    <Modal title="Oceń propozycję AI" onClose={onClose}>
      <h3>Opis posta</h3>
      <p>{r.caption}</p>
      <h3>Krótka relacja</h3>
      <p>{r.summary}</p>
      {r.summary && (
        <button className="text-button" onClick={() => void navigator.clipboard?.writeText(r.summary || '')}>
          <Copy size={13} /> Kopiuj relację (np. do aktualności na stronie)
        </button>
      )}
      <h3>Tekst alternatywny</h3>
      <p>{r.altText}</p>
      {stale && (
        <p className="form-error">Projekt zmienił się od wysłania żądania. Porównaj treść z aktualnymi danymi.</p>
      )}
      <button className="primary" onClick={onApply}>
        Zastosuj opis i tekst alternatywny
      </button>
    </Modal>
  );
}
