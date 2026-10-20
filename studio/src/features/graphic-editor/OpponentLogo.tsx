import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assetUrl, query, send } from '../../lib/api';
import { useReloadLibrary } from '../../lib/queries';
import type { Asset } from '../../lib/types';
import { useEditor } from './editor-context';

type Lookup = { asset: Asset | null; kalkUrl: string | null };
const sameTeam = (a: string, b: string) =>
  a.localeCompare(b, 'pl', { sensitivity: 'base', ignorePunctuation: true }) === 0;

// Brand rule M8: the rival's real logo (supplied or confirmed by the owner) instead of the neutral shield.
export default function OpponentLogo() {
  const { project, d, field, readonly, busy, action, assets } = useEditor();
  const reload = useReloadLibrary();
  const client = useQueryClient();
  const name = d.opponent.trim();
  const lookup = useQuery({
    queryKey: ['opponent-logo', name],
    queryFn: () => api<Lookup>(`/opponent-logos?${query({ name })}`),
    enabled: !!name,
    staleTime: 60_000,
  });
  const logos = assets.filter((a) => a.kind === 'opponent-logo' && a.status !== 'retired');
  const current = logos.find((a) => a.id === d.opponentLogoAssetId);
  const match = logos.find((a) => a.status === 'approved' && !!name && sameTeam(a.name, name)) || lookup.data?.asset;
  const suggested = match && match.id !== d.opponentLogoAssetId ? match : null;
  const drawn = project.visualStyle === 'sport' && ['announcement', 'result'].includes(project.family);
  const chooseLogo = async (asset: Asset) => {
    await Promise.all([reload(), client.invalidateQueries({ queryKey: ['opponent-logo'] })]);
    field('opponentLogoAssetId', asset.id);
  };
  async function upload(file: File) {
    const body = new FormData();
    body.set('file', file);
    body.set(
      'metadata',
      JSON.stringify({
        name: name || file.name,
        kind: 'opponent-logo',
        origin: `Plik od właściciela · ${file.name}`.slice(0, 500),
        people: '',
        jerseyNumber: '',
        consent: 'not_required',
        status: 'approved',
      }),
    );
    await chooseLogo(await api<Asset>('/assets', { method: 'POST', body }));
  }
  return (
    <div className="opponent-logo">
      <label>
        Logo rywala
        <select
          value={d.opponentLogoAssetId || ''}
          disabled={readonly}
          onChange={(e) => field('opponentLogoAssetId', e.target.value || null)}
        >
          <option value="">Tarcza z inicjałami (bez logo)</option>
          {logos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {name && !sameTeam(a.name, name) ? ' · inna drużyna' : ''}
              {a.status !== 'approved' ? ' · do sprawdzenia' : ''}
            </option>
          ))}
        </select>
      </label>
      {current && <img className="opponent-logo-thumb" src={assetUrl(current.id)} alt={`Logo: ${current.name}`} />}
      {!readonly && (
        <div className="button-row">
          {suggested && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void action(() => chooseLogo(suggested))}
            >
              Użyj logo z biblioteki · {suggested.name}
            </button>
          )}
          {!suggested && !current && lookup.data?.kalkUrl && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              title={lookup.data.kalkUrl}
              onClick={() =>
                void action(async () =>
                  chooseLogo(await send<Asset>('/opponent-logos/import-kalk', { opponent: name, confirmed: true })),
                )
              }
            >
              Pobierz logo z KALK
            </button>
          )}
          <label className="button secondary">
            {current ? 'Zamień plikiem' : 'Wgraj logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void action(() => upload(file));
              }}
            />
          </label>
        </div>
      )}
      <small>
        {drawn
          ? 'Logo trafia do biblioteki pod nazwą drużyny i podstawia się w kolejnych meczach. Bez logo grafika pokazuje tarczę ze skrótem.'
          : 'Ta kompozycja nie pokazuje znaku rywala.'}
      </small>
    </div>
  );
}
