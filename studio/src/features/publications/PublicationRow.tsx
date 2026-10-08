import { Link } from 'react-router';
import { playbook, publicationState, type ChannelId, type PublicationSummary } from '../../lib/publications';
import { ChannelBadge, formatDateTime } from './bits';

export default function PublicationRow({ p }: { p: PublicationSummary }) {
  const state = publicationState(p.items);
  return (
    <Link className="pub-row" to={`/publikacje/${p.id}`}>
      <span className="pub-row-date">{formatDateTime(p.plannedAt)}</span>
      <span className="pub-row-title">
        <b>{p.title}</b>
        <small>{playbook(p.playbook)?.label || p.playbook}</small>
      </span>
      <span className="channel-row">
        {p.items.map((i) => (
          <ChannelBadge key={i.id} channel={i.channel as ChannelId} status={i.status} />
        ))}
      </span>
      <span className={`pub-status pub-status-${state.key}`}>{state.label}</span>
    </Link>
  );
}
