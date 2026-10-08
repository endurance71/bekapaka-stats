import { useState } from 'react';
import { API, assetUrl, message, send } from '../../lib/api';
import { useAssets, usePartners, useReloadLibrary } from '../../lib/queries';
import type { Partner } from '../../lib/types';
import Modal from '../../components/Modal';
import { useShell } from '../../app/shell-context';
import { statuses } from './AssetLibrary';

function PartnerModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const reload = useReloadLibrary();
  const assets = useAssets();
  const { setError } = useShell();
  const [busy, setBusy] = useState(false);
  async function save(form: HTMLFormElement) {
    const f = new FormData(form);
    setBusy(true);
    try {
      const body = {
        name: f.get('name'),
        assetId: f.get('assetId') || null,
        status: f.get('status'),
        contractNote: f.get('contractNote'),
      };
      await send(
        partner.id ? `/partners/${encodeURIComponent(partner.id)}` : '/partners',
        body,
        partner.id ? 'PUT' : 'POST',
      );
      await reload();
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Sprawdź partnera" onClose={onClose} dismissible={false}>
      <p className="muted">Potwierdź aktualną nazwę i znak. Bez logo Studio użyje plakietki tekstowej.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(e.currentTarget);
        }}
      >
        <label>
          Nazwa
          <input name="name" defaultValue={partner.name} required maxLength={180} />
        </label>
        <label>
          Logo z biblioteki
          <select name="assetId" defaultValue={partner.assetId || ''}>
            <option value="">{partner.seedLogo ? 'Logo z pakietu marki' : 'Plakietka tekstowa'}</option>
            {(assets.data || [])
              .filter((a) => a.kind === 'logo')
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {statuses[a.status]}
                </option>
              ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={partner.status}>
            <option value="draft">Do sprawdzenia</option>
            <option value="approved">Potwierdzam aktualność partnera i znaku</option>
            <option value="retired">Wycofany</option>
          </select>
        </label>
        <label>
          Warunki ekspozycji / uwagi
          <textarea name="contractNote" defaultValue={partner.contractNote} maxLength={1000} />
        </label>
        <p className="muted">
          Wyjątek umowny wymaga zatwierdzonego szablonu obsługującego te warunki. Domyślny układ pozostaje równy i
          alfabetyczny.
        </p>
        <button className="primary" disabled={busy}>
          Zapisz partnera
        </button>
      </form>
    </Modal>
  );
}

export default function PartnerRegistry() {
  const partners = usePartners();
  const [partner, setPartner] = useState<Partner | null>(null);
  return (
    <>
      <div className="section-title">
        <h2>Rejestr partnerów</h2>
        <button
          className="secondary"
          onClick={() =>
            setPartner({ id: '', name: '', assetId: null, seedLogo: null, status: 'draft', contractNote: '' })
          }
        >
          Dodaj partnera
        </button>
      </div>
      <div className="partner-grid">
        {(partners.data || []).map((p) => (
          <button key={p.id} onClick={() => setPartner(p)}>
            <div className="partner-logo">
              {p.assetId ? (
                <img src={assetUrl(p.assetId)} alt="" />
              ) : p.seedLogo ? (
                <img src={`${API}/partners/${encodeURIComponent(p.id)}/logo`} alt="" />
              ) : (
                <b>{p.name}</b>
              )}
            </div>
            <h3>{p.name}</h3>
            <span className={`status status-${p.status}`}>{statuses[p.status]}</span>
          </button>
        ))}
      </div>
      {partner && <PartnerModal partner={partner} onClose={() => setPartner(null)} />}
    </>
  );
}
