import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { accel, Big, brand, C, Label, lerp, p, Plate, Push, shakeAt, Slam, Stripes } from '../kit';
import { plural, record } from '../match';
import { EndCard, Matchup, Template, useMatch, When } from './shared';

/** Hak: skrzydła V wbijają się od dołu, nad nimi „WRACAMY” (albo „GRAMY” bez przerwy w sezonie). */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const v = p(f, -4, 14);
  const out = p(f, 40, 8, accel);
  return (
    <AbsoluteFill>
      <Plate dim={0.45} drift={p(f, 0, 48)} />
      <AbsoluteFill style={{ transform: `translateY(${-out * 260}px)` }}>
        <Img src={brand('znak-v.svg')} style={{ position: 'absolute', width: 900, left: 90, top: 820, transform: `translateY(${(1 - v) * 700}px) scale(${lerp(0.7, 1, v) + 0.04 * p(f, 10, 40)})` }} />
        {m.comeback ? <Label text={m.comeback} f={f} at={4} y={640} size={50} /> : null}
        <Big text={m.comeback ? 'WRACAMY' : 'GRAMY'} f={f} at={7} y={760} size={250} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Bilans z rywalem na papierze: liczba meczów, potem uderzenie wyniku. */
const H2H: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = record(m.h2h!.results);
  const punch = r.wins === 0 ? plural(r.losses, 'PORAŻKA', 'PORAŻKI', 'PORAŻEK')
    : r.losses === 0 ? plural(r.wins, 'WYGRANA', 'WYGRANE', 'WYGRANYCH') : `${r.wins} W · ${r.losses} P`;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 17, 7, 1.2)}px)` }}>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.15} src="lineup-paper.png" />
        <Label text={m.h2h!.label ?? 'NASZ BILANS Z NIMI'} f={f} at={0} y={600} size={44} color={C.black} />
        <Big text={plural(r.games, 'MECZ', 'MECZE', 'MECZÓW')} f={f} at={3} y={700} size={290} color={C.black} shadow={false} />
        <Slam text={punch} f={f} at={12} y={1000} size={250} color={C.red} from={1.9} shadow={false} />
      </Push>
    </AbsoluteFill>
  );
};

/** Puenta w trzech wierszach, ostatni na czerwono, pod nim paski stroju. */
const Point: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const [a, b, c] = m.headline!;
  const out = p(f, len - 8, 8, accel);
  return (
    <AbsoluteFill>
      <Plate dim={0.5} drift={p(f, 0, len)} />
      <AbsoluteFill style={{ transform: `translateY(${-out * 300}px)` }}>
        <Big text={a} f={f} at={0} y={600} size={210} />
        <Big text={b} f={f} at={5} y={800} size={250} />
        <Big text={c} f={f} at={10} y={1035} size={250} color={C.red} />
        <Stripes f={f} at={20} y={1300} x={140} w={800} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const wracamy: Template = {
  id: 'A-Wracamy',
  title: 'A · Wracamy - hak, starcie, bilans, puenta, godzina',
  requires: (m) => (!m.headline ? 'brak „headline” (trzy wiersze puenty)' : null),
  shots: (m) => [
    { len: 48, el: <Hook /> },
    { len: 60, el: <Matchup len={60} />, wipe: true },
    ...(m.h2h?.results.length ? [{ len: 54, el: <H2H len={54} /> }] : []),
    { len: 46, el: <Point len={46} /> },
    { len: 44, el: <When len={44} /> },
    { len: 72, el: <EndCard />, wipe: true },
  ],
};
