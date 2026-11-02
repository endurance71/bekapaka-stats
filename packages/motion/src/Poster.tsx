import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { generated, Parts } from './match';

const decay = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, start: number, dur: number) =>
  interpolate(f, [start, start + dur], [0, 1], { easing: decay, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const G: React.FC<{ svg: string; t?: string; o?: number; clip?: string }> = ({ svg, t, o = 1, clip }) => (
  <g transform={t} opacity={o} clipPath={clip} dangerouslySetInnerHTML={{ __html: svg }} />
);
// Skala wokół punktu (transformacje SVG nie mają transform-origin).
const around = (cx: number, cy: number, sx: number, sy = sx) => `translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

/**
 * Zapowiedź ze Studio składana z warstw na osi 195 klatek: wstęga i data → herb i znak rywala → VS i szewrony
 * → nazwy → panel godziny → hala i wstęp → paski i logo, potem najazd kamery. Plansza końcowa wzorów.
 */
export const Poster: React.FC<{ parts: Parts; posterId: string; frame: number }> = ({ parts: P, posterId, frame: f }) => {
  const length = 195;
  const bgScale = interpolate(f, [0, length], [1.1, 1.0]);
  const camScale = interpolate(f, [0, length], [1.035, 1.0]);
  const rib = prog(f, 2, 14);
  const date = prog(f, 10, 16);
  const crest = prog(f, 16, 22);
  const rival = prog(f, 20, 22);
  const vs = prog(f, 34, 10);
  const shake = f >= 40 && f < 48 ? Math.sin((f - 40) * 2.4) * (48 - f) * 0.9 : 0;
  const names = prog(f, 46, 16);
  const panel = prog(f, 62, 16);
  const line = prog(f, 68, 16);
  const time = prog(f, 72, 18);
  const venue = prog(f, 92, 16);
  const entry = prog(f, 98, 16);
  const stripes = P.stripes.map((_, i) => prog(f, 104 + i * 4, 18));
  const logo = prog(f, 112, 16);
  const pulse = f > 130 ? 1 + 0.06 * Math.max(0, Math.sin(((f - 130) / 30) * Math.PI)) : 1;
  const rise = (t: number, px = 28) => `translate(0 ${(1 - t) * px})`;
  const fade = (t: number) => 0.4 * Math.min(1, t * 4) + 0.6 * t;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0B0B' }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs dangerouslySetInnerHTML={{ __html: P.defs.replace(/^<defs>|<\/defs>$/g, '') }} />
        <defs>
          <clipPath id="ribbonClip"><rect x={540 - 270 * rib} y={250} width={540 * rib} height={110} /></clipPath>
          <clipPath id="panelClip"><polygon points={`160 1330, ${160 + 780 * panel} 1330, ${300 + 780 * panel} 1090, 300 1090`} /></clipPath>
          <clipPath id="lineClip"><rect x={160} y={1090} width={900 * line} height={240} /></clipPath>
          <clipPath id="timeClip"><rect x={160} y={1120} width={900} height={182} /></clipPath>
          {stripes.map((s, i) => <clipPath id={`stripe${i}`} key={i}><rect x={72} y={1740} width={936 * s} height={50} /></clipPath>)}
        </defs>
        <g transform={around(540, 960, bgScale)}>
          <image href={generated(posterId, P.materialFile)} x={0} y={0} width={1080} height={1920} preserveAspectRatio="xMidYMid slice" />
          <G svg={P.materialTint} />
        </g>
        <g transform={around(540, 960, camScale)}>
          <G svg={P.seams} o={prog(f, 0, 30)} t={around(540, 880, 0.9 + 0.1 * prog(f, 0, 40))} />
          <G svg={P.ribbon} clip="url(#ribbonClip)" />
          <G svg={P.date} t={rise(date)} o={fade(date)} />
          <G svg={P.crest} t={`translate(${-420 * (1 - crest)} 0) ${around(270, 770, 0.86 + 0.14 * crest)}`} o={Math.min(1, crest * 3)} />
          <G svg={P.rival} t={`translate(${420 * (1 - rival)} 0) ${around(810, 760, 0.86 + 0.14 * rival)}`} o={Math.min(1, rival * 3)} />
          <g transform={`translate(${shake} 0)`}><G svg={P.vs} t={around(540, 768, 1.8 - 0.8 * vs)} o={Math.min(1, vs * 2.5)} /></g>
          <g transform={around(540, 900, pulse)}>
            {P.chevrons.map((c, i) => {
              const t = prog(f, 42 + i * 4, 10);
              return <G key={i} svg={c} t={`translate(0 ${-40 * (1 - t)})`} o={t} />;
            })}
          </g>
          <G svg={P.nameUs} t={rise(names)} o={fade(names)} />
          <G svg={P.nameThem} t={rise(prog(f, 50, 16))} o={fade(prog(f, 50, 16))} />
          <G svg={P.panelFill} clip="url(#panelClip)" />
          <G svg={P.panelLine} clip="url(#lineClip)" />
          <g clipPath="url(#timeClip)"><G svg={P.time} t={`translate(0 ${(1 - time) * 170}) ${around(540, 1210, 1.12 - 0.12 * time)}`} /></g>
          <G svg={P.venue} t={rise(venue)} o={fade(venue)} />
          <G svg={P.entry} t={rise(entry)} o={fade(entry)} />
          {P.stripes.map((s, i) => <G key={i} svg={s} clip={`url(#stripe${i})`} />)}
          <G svg={P.foot} t={`translate(${-60 * (1 - logo)} 0)`} o={logo} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
