import { Download } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { API } from '../lib/api';
import {
  brandVoice,
  channelIds,
  channelInstructions,
  channels,
  playbooks,
  PROMPT_VERSION,
  type ChannelId,
} from '../lib/publications';
import { ChannelBadge } from '../features/publications/bits';
import '../features/publications/publications.css';

// Read-only view of what Gemini and external agents receive. Changing it is a code release with a new version.
export default function PromptsPage() {
  return (
    <>
      <PageHeader
        title="Schematy i prompty"
        kind="publication"
        actions={
          <a className="secondary" href={`${API}/prompts/document`}>
            <Download size={16} /> Dokument dla agenta (.md)
          </a>
        }
      />
      <p className="muted">
        Wersja promptów <b>{PROMPT_VERSION}</b>. Te same zasady stosują: Gemini w Studio, agent przez MCP i kontrola
        marki. Zmiana wymaga nowego wydania Studio — dzięki temu każdy tekst AI ma zapisaną wersję, z której powstał.
      </p>
      <section className="prompt-block">
        <h2>Zasady marki</h2>
        <pre>{brandVoice}</pre>
      </section>
      <section className="prompt-block">
        <h2>Instrukcje kanałów</h2>
        {(channelIds as ChannelId[]).map((c) => (
          <details key={c}>
            <summary>
              <ChannelBadge channel={c} decorative /> {channels[c].label}
            </summary>
            <pre>{channelInstructions[c]}</pre>
          </details>
        ))}
      </section>
      <section className="prompt-block">
        <h2>Schematy publikacji ({playbooks.length})</h2>
        <div className="schema-table" role="table">
          {playbooks.map((p) => (
            <div key={p.id} role="row">
              <span role="cell">
                <b>{p.label}</b>
                <small>
                  {p.category} · {p.timing}
                </small>
              </span>
              <span role="cell" className="channel-row">
                {(Object.keys(p.items) as ChannelId[]).map((c) => (
                  <ChannelBadge key={c} channel={c} />
                ))}
              </span>
              <span role="cell">{p.hint}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
