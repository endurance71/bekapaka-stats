import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Big, C, Count, Label, p, Plate, Push, shakeAt, Slam, Stripes, wear } from '../kit';
import { plural, record } from '../match';
import { PosterCard, Template, useMatch } from './shared';

/** Hak: „WYGRANA” uderza na czerwieni, wynik odlicza się od zera, BeKaPaKa zawsze pierwsza. */
const Score: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = m.result!;
  const won = r.us > r.them;
  return (
    <AbsoluteFill style={{ backgroundColor: won ? C.red : C.black, transform: `translateX(${shakeAt(f, 7)}px)` }}>
      <Push f={f} len={len}>
        {m.round ? <Label text={m.round} f={f} at={0} y={520} size={46} /> : null}
        <Slam text={won ? 'WYGRANA' : r.us < r.them ? 'PORAŻKA' : 'REMIS'} f={f} at={0} y={600} size={200} color={won ? C.black : C.white} from={2.2} shadow={false} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: 300, lineHeight: 0.95, color: C.white, transform: 'skewX(-9deg)', ...wear }}>
          <Count to={r.us} f={f} at={8} />
          <span style={{ color: won ? C.black : C.red }}>:</span>
          <Count to={r.them} f={f} at={8} />
        </div>
        <Label text={`BEKAPAKA — ${m.opponent.toUpperCase()}`} f={f} at={20} y={1150} size={44} />
      </Push>
    </AbsoluteFill>
  );
};

/** Przebieg po kwartach; wiersze wchodzą po kolei, wygrane przez nas kwarty świecą czerwienią. */
const Quarters: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const qs = m.result!.quarters!;
  return (
    <AbsoluteFill>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.5} />
        <Label text="KWARTA PO KWARCIE" f={f} at={0} y={470} size={46} color={C.muted} />
        {qs.map((q, i) => {
          const t = p(f, 4 + i * 6, 12);
          const ours = q.us > q.them;
          return (
            <div key={i} style={{
              position: 'absolute', left: 140, right: 140, top: 570 + i * 160, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              opacity: Math.min(1, t * 2), transform: `translateX(${(1 - t) * (i % 2 ? 700 : -700)}px) skewX(-9deg)`,
              borderBottom: `6px solid ${ours ? C.red : 'rgba(247,246,242,.25)'}`,
            }}>
              <span style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 46, letterSpacing: 10, color: C.muted }}>{`${i + 1}. KW.`}</span>
              <span style={{ fontFamily: 'BC', fontWeight: 800, fontSize: 130, lineHeight: 1, color: ours ? C.white : C.muted }}>{`${q.us}:${q.them}`}</span>
            </div>
          );
        })}
        {m.result!.halftime ? <Label text={`DO PRZERWY ${m.result!.halftime.us}:${m.result!.halftime.them}`} f={f} at={30} y={1225} size={40} color={C.gold} /> : null}
      </Push>
    </AbsoluteFill>
  );
};

/** Jedna liczba meczu z faktów (np. +25) i jej podpis. */
const Highlight: React.FC<{ len: number; i: number }> = ({ len, i }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const h = m.result!.highlights![i];
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 6)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.45} />
        <Slam text={h.value} f={f} at={0} y={560} size={420} color={C.red} from={2.4} />
        {h.label.map((line, j) => <Big key={j} text={line} f={f} at={10 + j * 4} y={1000 + j * 140} size={130} />)}
      </Push>
    </AbsoluteFill>
  );
};

/** Lider meczu na papierze: imię, nazwisko, punkty z uderzeniem, linijka statystyk. */
const Leader: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const l = m.result!.leader!;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 21, 7, 1)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.15} src="lineup-paper.png" />
        <Label text="NAJWIĘCEJ PUNKTÓW" f={f} at={0} y={520} size={44} color={C.black} />
        <Big text={l.firstName.toUpperCase()} f={f} at={2} y={610} size={200} color={C.black} shadow={false} />
        <Big text={l.lastName.toUpperCase()} f={f} at={6} y={800} size={200} color={C.black} shadow={false} stagger={1} />
        <Slam text={`${l.points} PKT`} f={f} at={16} y={1020} size={190} color={C.red} from={1.8} shadow={false} />
        {l.line ? <Label text={l.line} f={f} at={24} y={1210} size={42} color={C.black} /> : null}
      </Push>
    </AbsoluteFill>
  );
};

/** Bilans sezonu po meczu: mecze i wygrane. */
const Record: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = record(m.season!.scores);
  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Push f={f} len={len}>
        <Plate dim={0.5} />
        <Label text={m.season!.label} f={f} at={0} y={560} size={46} color={C.muted} />
        <Big text={plural(r.games, 'MECZ', 'MECZE', 'MECZÓW')} f={f} at={3} y={660} size={250} />
        <Slam text={plural(r.wins, 'WYGRANA', 'WYGRANE', 'WYGRANYCH')} f={f} at={12} y={920} size={215} color={C.red} from={1.9} />
        <Stripes f={f} at={20} y={1170} x={240} w={600} />
      </Push>
    </AbsoluteFill>
  );
};

export const wynik: Template = {
  id: 'F-Wynik',
  title: 'F · Wynik - wynik meczu, kwarty, liczba meczu, lider, bilans, grafika wyniku ze Studio',
  requires: (m) => (!m.result ? 'brak „result” (wynik meczu z faktów publikacji)' : null),
  shots: (m) => [
    { len: 50, el: <Score len={50} /> },
    ...(m.result!.quarters?.length ? [{ len: 66, el: <Quarters len={66} />, wipe: true }] : []),
    ...(m.result!.highlights ?? []).map((_, i) => ({ len: 48, el: <Highlight len={48} i={i} /> })),
    ...(m.result!.leader ? [{ len: 56, el: <Leader len={56} /> }] : []),
    ...(m.season?.scores.length ? [{ len: 48, el: <Record len={48} /> }] : []),
    { len: 76, el: <PosterCard file="poster-final.png" />, wipe: true },
  ],
};
