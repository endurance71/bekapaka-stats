import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { BladeWipe, brand, C, Clock, Crest, Label, lerp, p, Plate, Push, Rival, shakeAt, wear } from '../kit';
import { generated, MatchProps, Parts, useParts, when } from '../match';
import { Poster } from '../Poster';

type Match = { m: MatchProps; parts: Parts; w: ReturnType<typeof when> };
const Ctx = createContext<Match | null>(null);
export const useMatch = () => useContext(Ctx)!;

/** Ujęcie filmu; `wipe` = cięcie przed nim zakrywa czerwone ostrze. */
export type Shot = { len: number; el: React.ReactNode; wipe?: boolean };
export type Template = {
  id: string;
  title: string;
  /** Czego wzór wymaga w danych meczu; brak = błąd zamiast pustej sceny. */
  requires: (m: MatchProps) => string | null;
  shots: (m: MatchProps) => Shot[];
};
export const filmLength = (shots: Shot[]) => shots.reduce((a, s) => a + s.len, 0);

/** Składa ujęcia w film: sekwencje jedna po drugiej, ostrza wyśrodkowane na wybranych cięciach. */
export const Film: React.FC<{ m: MatchProps; template: Template }> = ({ m, template }) => {
  const parts = useParts(m.posterId);
  const missing = template.requires(m);
  if (missing) throw new Error(`Wzór ${template.id}: ${missing}`);
  if (!parts) return null;
  let at = 0;
  const seqs: React.ReactNode[] = [];
  const wipes: React.ReactNode[] = [];
  template.shots(m).forEach((s, i) => {
    seqs.push(<Sequence key={i} from={at} durationInFrames={s.len}>{s.el}</Sequence>);
    if (s.wipe && at > 0) wipes.push(<Sequence key={`w${i}`} from={at - 8} durationInFrames={17}><BladeWipe /></Sequence>);
    at += s.len;
  });
  return (
    <Ctx.Provider value={{ m, parts, w: when(m.kickoff) }}>
      <AbsoluteFill style={{ backgroundColor: C.black }}>{seqs}{wipes}</AbsoluteFill>
    </Ctx.Provider>
  );
};

// ======================= sceny wspólne =======================

/** Kadr dzielony po skosie: herb z lewej, znak rywala z prawej, VS ląduje na linii podziału. */
export const Matchup: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, parts } = useMatch();
  const seam = p(f, 0, 12);
  const crest = p(f, 2, 16);
  const rival = p(f, 6, 16);
  const vs = p(f, 14, 7);
  const off = (1 - seam) * 700;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 20)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.35} url={generated(m.posterId, parts.materialFile)} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          <polygon points={`${-200 + off},${1290 + off * 0.45} ${1280 + off},${630 + off * 0.45} 1400,2100 -200,2100`} fill={C.red} />
          <polygon points={`${-200 + off},${1310 + off * 0.45} ${1280 + off},${650 + off * 0.45} 1400,2100 -200,2100`} fill={C.redDark} opacity={0.5} />
        </svg>
        <Crest style={{ width: 520, left: 90, top: 250, transform: `translateX(${(1 - crest) * -800}px) rotate(${(1 - crest) * -6}deg)` }} />
        <Rival svg={parts.rival} width={420} style={{ left: 560, top: 1010, transform: `translateX(${(1 - rival) * 800}px) rotate(${(1 - rival) * 6}deg)` }} />
        <Label text={m.opponent.toUpperCase()} f={f} at={14} y={1500} size={52} />
      </Push>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: 280,
        color: C.white, lineHeight: 1, opacity: Math.min(1, vs * 3),
        transform: `skewX(-9deg) scale(${lerp(2.4, 1, vs)})`, filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.8))', ...wear,
      }}>VS</div>
    </AbsoluteFill>
  );
};

/** Dzień i data, godzina na rolkach w złotym panelu ostrza, hala i wstęp. */
export const When: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const panel = p(f, 2, 12);
  const size = 250;
  return (
    <AbsoluteFill>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.5} />
        <Img src={brand('wzor-skrzydla.svg')} style={{ position: 'absolute', width: 1080, left: 0, top: 420 + interpolate(f, [0, 60], [0, -80]), opacity: 0.55 }} />
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,11,11,.9) 0%, rgba(11,11,11,0) 30%, rgba(11,11,11,0) 70%, rgba(11,11,11,.9) 100%)' }} />
        <Label text={`${w.day} · ${w.dm}`} f={f} at={0} y={640} size={56} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          <defs><clipPath id="whenPanel"><rect x={0} y={0} width={1080 * panel} height={1920} /></clipPath></defs>
          <g clipPath="url(#whenPanel)">
            <polygon points="250,780 980,780 830,1080 100,1080" fill={C.black} />
            <polygon points="250,780 980,780 830,1080 100,1080" fill="none" stroke={C.gold} strokeWidth={8} />
          </g>
        </svg>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 810, display: 'flex', justifyContent: 'center', fontFamily: 'BC', fontWeight: 800,
          fontSize: size, color: C.white, transform: 'skewX(-9deg)', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.7))', opacity: Math.min(1, panel * 2), ...wear,
        }}>
          <Clock time={w.time} f={f} at={6} size={size} />
        </div>
        <Label text={m.venue} f={f} at={18} y={1150} size={48} />
        {m.entry ? <Label text={m.entry.toUpperCase()} f={f} at={22} y={1225} size={40} color={C.gold} /> : null}
      </Push>
    </AbsoluteFill>
  );
};

/** Plansza końcowa: zapowiedź ze Studio składa się szybko (36 kl.) i zostaje z najazdem kamery. */
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { m, parts } = useMatch();
  const frame = f < 36 ? f * 3.45 : Math.min(195, 124 + (f - 36) * 1.2);
  return <Poster parts={parts} posterId={m.posterId} frame={frame} />;
};

/** Plansza końcowa z gotowego PNG Studio (styl redakcyjny), odsłaniana od dołu. */
export const PosterCard: React.FC<{ file: string }> = ({ file }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const reveal = p(f, 0, 14);
  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <AbsoluteFill style={{ clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)` }}>
        <Img src={generated(m.posterId, file)} style={{ width: '100%', height: '100%', transform: `scale(${1.06 - 0.06 * p(f, 0, 80, Easing.linear)})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
