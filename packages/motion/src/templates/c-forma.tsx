import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Big, C, Count, Label, p, Plate, Push, shakeAt, Slam, Stripes, wear } from '../kit';
import { plural, record } from '../match';
import { EndCard, Matchup, Template, useMatch } from './shared';

/** Czerwony kadr: liczba meczów i wygranych w sezonie. */
const Wins: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = record(m.season!.scores);
  return (
    <AbsoluteFill style={{ backgroundColor: C.red, transform: `translateX(${shakeAt(f, 17)}px)` }}>
      <Push f={f} len={len}>
        <Label text={m.season!.label} f={f} at={0} y={560} size={46} />
        <Big text={plural(r.games, 'MECZ', 'MECZE', 'MECZÓW')} f={f} at={3} y={660} size={270} />
        <Slam text={plural(r.wins, 'WYGRANA', 'WYGRANE', 'WYGRANYCH')} f={f} at={12} y={930} size={225} color={C.black} from={1.9} shadow={false} />
      </Push>
    </AbsoluteFill>
  );
};

/** Bilans punktów odliczany od zera, pod nim wyniki meczów. */
const Points: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = record(m.season!.scores);
  return (
    <AbsoluteFill>
      <Push f={f} len={len}>
        <Plate dim={0.5} />
        <Label text="PUNKTY W SEZONIE" f={f} at={0} y={600} size={46} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: 300, lineHeight: 0.95, color: C.white, transform: 'skewX(-9deg)', ...wear }}>
          <Count to={r.pointsFor} f={f} at={2} />
          <span style={{ color: C.red }}>:</span>
          <Count to={r.pointsAgainst} f={f} at={2} />
        </div>
        <Label text={m.season!.scores.map((s) => `${s.us}:${s.them}`).join(' · ')} f={f} at={16} y={1030} size={44} color={C.muted} />
        <Stripes f={f} at={18} y={1130} x={240} w={600} />
      </Push>
    </AbsoluteFill>
  );
};

/** Najlepszy strzelec na papierze: imię, nazwisko, średnia z uderzeniem. */
const Leader: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const l = m.season!.leader!;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 21, 7, 1)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.15} src="lineup-paper.png" />
        <Label text="NAJWIĘCEJ PUNKTÓW" f={f} at={0} y={560} size={44} color={C.black} />
        <Big text={l.firstName.toUpperCase()} f={f} at={2} y={650} size={210} color={C.black} shadow={false} />
        <Big text={l.lastName.toUpperCase()} f={f} at={6} y={840} size={210} color={C.black} shadow={false} stagger={1} />
        <Slam text={`${l.perGame} PKT NA MECZ`} f={f} at={16} y={1090} size={150} color={C.red} from={1.8} shadow={false} />
      </Push>
    </AbsoluteFill>
  );
};

/** Ile drużyn w grupie jest niepokonanych - pokazujemy tylko, gdy jesteśmy wśród nich. */
const Unbeaten: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const u = m.season!.unbeaten!;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 6)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.45} />
        <Label text={u.group} f={f} at={0} y={500} size={50} color={C.muted} />
        <Slam text={String(u.count)} f={f} at={0} y={540} size={560} color={C.red} from={2.4} />
        <Big text={u.count === 1 ? 'NIEPOKONANI' : 'NIEPOKONANE'} f={f} at={10} y={1090} size={170} />
        {u.count > 1 ? <Label text="W TYM MY" f={f} at={24} y={1290} size={60} color={C.gold} /> : null}
      </Push>
    </AbsoluteFill>
  );
};

export const forma: Template = {
  id: 'C-Forma',
  title: 'C · Forma - sezon w liczbach, lider, niepokonani, starcie',
  requires: (m) => (!m.season?.scores.length ? 'brak „season.scores” (wyniki sezonu)' : null),
  shots: (m) => [
    { len: 45, el: <Wins len={45} /> },
    { len: 48, el: <Points len={48} /> },
    ...(m.season!.leader ? [{ len: 52, el: <Leader len={52} /> }] : []),
    ...(m.season!.unbeaten?.withUs ? [{ len: 50, el: <Unbeaten len={50} /> }] : []),
    { len: 54, el: <Matchup len={54} />, wipe: true },
    { len: 72, el: <EndCard />, wipe: true },
  ],
};
