import { useState } from 'react';
import { Facebook, Globe, Instagram, Smartphone, X } from 'lucide-react';
import { channels, itemStatuses, type ChannelId, type Issue } from '../../lib/publications';

export const channelIcons = {
  instagram_feed: Instagram,
  instagram_story: Smartphone,
  facebook: Facebook,
  website: Globe,
};

export function ChannelBadge({ channel, status }: { channel: ChannelId; status?: string }) {
  const Icon = channelIcons[channel];
  return (
    <span
      className={`channel-badge channel-${channel} ${status ? `is-${status}` : ''}`}
      title={`${channels[channel].label}${status ? ` · ${itemStatuses[status as keyof typeof itemStatuses]}` : ''}`}
    >
      <Icon size={13} aria-hidden="true" />
      <span className="sr-only">{channels[channel].label}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pub-status pub-status-${status}`}>
      {itemStatuses[status as keyof typeof itemStatuses] || status}
    </span>
  );
}

export function Counter({ value, max, min }: { value: string; max: number; min?: number }) {
  const n = value.length;
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return (
    <small className={`char-counter ${bad ? 'is-over' : ''}`}>
      {n}
      {min !== undefined ? ` / ${min}–${max}` : ` / ${max}`}
    </small>
  );
}

export function Issues({ issues, field }: { issues: Issue[]; field?: string }) {
  const list = field ? issues.filter((i) => i.field === field) : issues;
  if (!list.length) return null;
  return (
    <ul className="lint-list">
      {list.map((i, n) => (
        <li key={n} className={`lint-${i.level}`}>
          {i.message}
        </li>
      ))}
    </ul>
  );
}

// Hashtags as chips; the owner-approved set comes from Settings.
export function HashtagInput({
  value,
  onChange,
  max,
  suggestions = [],
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  suggestions?: string[];
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const tag = '#' + raw.trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (tag.length < 3 || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setText('');
  };
  return (
    <div className="hashtags">
      <div className="hashtag-chips">
        {value.map((t) => (
          <span key={t} className="hashtag-chip">
            {t}
            <button
              type="button"
              aria-label={`Usuń ${t}`}
              disabled={disabled}
              onClick={() => onChange(value.filter((x) => x !== t))}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            aria-label="Dodaj hashtag"
            placeholder="#hashtag"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (['Enter', ',', ' '].includes(e.key)) {
                e.preventDefault();
                add(text);
              }
            }}
            onBlur={() => text && add(text)}
          />
        )}
      </div>
      {suggestions.filter((s) => !value.includes(s)).length > 0 && value.length < max && (
        <div className="hashtag-suggestions">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button key={s} type="button" className="text-button" disabled={disabled} onClick={() => add(s)}>
                + {s}
              </button>
            ))}
        </div>
      )}
      <small className="muted">
        {value.length}/{max}
      </small>
    </div>
  );
}

export const formatDateTime = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : 'bez terminu';
