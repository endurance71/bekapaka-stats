import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import { message, send } from '../lib/api';
import { keys, useSettings } from '../lib/queries';
import type { Settings } from '../lib/publications';
import { HashtagInput } from '../features/publications/bits';
import '../features/publications/publications.css';

// Proposals only: the brand defines #BKPK; anything else needs the owner's decision.
const proposals = ['#BeKaPaKaBobolice', '#Bobolice', '#KALK', '#koszykówka', '#Koszalin'];

export default function SettingsPage() {
  const client = useQueryClient();
  const settings = useSettings();
  const [draft, setDraft] = useState<Settings | null>(null);
  const [state, setState] = useState('');
  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);
  if (!draft) return <div className="loading">Wczytuję ustawienia…</div>;
  async function save() {
    try {
      const saved = await send<Settings>('/settings', draft, 'PUT');
      client.setQueryData(keys.settings, saved);
      setState('Zapisano. Nowe publikacje i „Wypełnij ze schematu” użyją tych hashtagów.');
    } catch (err) {
      setState(message(err));
    }
  }
  return (
    <>
      <PageHeader title="Ustawienia publikacji" kind="publication" />
      <section className="settings-card">
        <h2>Hashtagi</h2>
        <p className="muted">
          Księga marki definiuje jeden hashtag klubu: <b>#BKPK</b>. Pozostałe są propozycją — dodaj je tylko po decyzji
          klubu.
        </p>
        <div className="field-block">
          <span className="field-label">Instagram (do 5)</span>
          <HashtagInput
            value={draft.hashtags.instagram}
            max={5}
            suggestions={['#BKPK', ...proposals]}
            onChange={(instagram) => setDraft({ ...draft, hashtags: { ...draft.hashtags, instagram } })}
          />
        </div>
        <div className="field-block">
          <span className="field-label">Facebook (0–2)</span>
          <HashtagInput
            value={draft.hashtags.facebook}
            max={2}
            suggestions={['#BKPK', ...proposals]}
            onChange={(facebook) => setDraft({ ...draft, hashtags: { ...draft.hashtags, facebook } })}
          />
        </div>
        <button className="primary" onClick={() => void save()}>
          Zapisz
        </button>
        {state && (
          <p role="status" className="muted">
            {state}
          </p>
        )}
      </section>
    </>
  );
}
