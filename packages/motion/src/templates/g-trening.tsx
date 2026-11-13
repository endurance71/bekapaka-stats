import React from 'react';
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Big, C, Label, lerp, p, shakeAt, Slam, wear } from '../kit';
import { fitSize, TrainingShot } from '../match';
import { EndCard, Matchup, Shot, Template, useMatch, When } from './shared';

const FPS = 30;

/** Odcinki jednego klipu jeden po drugim: tempo 1 = na żywo, < 1 = zwolnienie (materiał 120 kl./s). */
const Clip: React.FC<{ s: TrainingShot; dir: string }> = ({ s, dir }) => {
  let at = 0;
  let src = s.from;
  return (
    <>
      {s.segs.map((g, i) => {
        const el = (
          <Sequence key={i} from={at} durationInFrames={g.len}>
            <OffthreadVideo
              src={staticFile(`footage/${dir}/${s.clip}`)}
              trimBefore={Math.round(src * FPS)}
              playbackRate={g.rate}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(1.06)' }}
            />
          </Sequence>
        );
        at += g.len;
        src += (g.len / FPS) * g.rate;
        return el;
      })}
    </>
  );
};

/** Pieczątka z ptaszkiem, uderza skalą jak „WSTĘP WOLNY” we wzorze E. */
const Stamp: React.FC<{ text: string; f: number; at: number }> = ({ text, f, at }) => {
  const s = p(f, at, 6);
  const tick = p(f, at + 4, 8);
  const size = fitSize(text, 130, 560, 'display', 0.03);
  return (
    <div style={{
      position: 'absolute', left: 120, top: 1050, width: 840, height: 190, border: `12px solid ${C.red}`, borderRadius: 18, backgroundColor: 'rgba(11,11,11,.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, transform: `rotate(-7deg) scale(${lerp(2.6, 1, s)})`, opacity: f < at ? 0 : Math.min(1, s * 3), ...wear,
    }}>
      <span style={{ fontFamily: 'BC', fontWeight: 800, fontSize: size, lineHeight: 1, color: C.red, letterSpacing: 4, transform: 'skewX(-9deg)', whiteSpace: 'nowrap' }}>{text}</span>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <path d="M14 64 L48 96 L108 22" fill="none" stroke={C.red} strokeWidth={20} strokeLinecap="square" strokeDasharray={170} strokeDashoffset={170 * (1 - tick)} />
      </svg>
    </div>
  );
};

/** Ujęcie z treningu: klip ze zwolnieniem na akcji, napisy w górnej strefie, błysk i wstrząs na wsadzie. */
const Training: React.FC<{ s: TrainingShot; len: number }> = ({ s, len }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const slowAt = s.segs[0].rate === 1 && s.segs.length > 1 ? s.segs[0].len : -1;
  const punch = slowAt >= 0 ? p(f, slowAt, 10) * 0.07 : 0;
  const hit = s.hit ?? -100;
  const flash = f >= hit ? interpolate(f, [hit, hit + 5], [0.55, 0], { extrapolateRight: 'clamp' }) : 0;
  const scale = 1.02 + 0.03 * p(f, 0, len, Easing.linear) + punch + (f >= hit && f < hit + 6 ? 0.02 * (1 - (f - hit) / 6) : 0);
  return (
    <AbsoluteFill style={{ backgroundColor: C.black, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${shakeAt(f, hit, 8, 1.6)}px)`, transformOrigin: '50% 45%' }}>
        <Clip s={s} dir={m.training!.dir} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,11,11,.78) 0%, rgba(11,11,11,.45) 24%, rgba(11,11,11,0) 38%, rgba(11,11,11,0) 52%, rgba(11,11,11,.5) 75%, rgba(11,11,11,.7) 100%)' }} />
      <AbsoluteFill style={{ backgroundColor: C.white, opacity: flash }} />
      {s.label ? <Label text={s.label} f={f} at={0} y={280} size={42} color={C.gold} /> : null}
      {s.title ? <Slam text={s.title} f={f} at={1} y={340} size={200} color={s.red ? C.red : C.white} from={2.2} /> : null}
      {s.title2 ? <Big text={s.title2} f={f} at={5} y={535} size={124} /> : null}
      {s.stamp ? <Stamp text={s.stamp} f={f} at={hit} /> : null}
    </AbsoluteFill>
  );
};

const shotLen = (s: TrainingShot) => s.segs.reduce((a, g) => a + g.len, 0);

export const trening: Template = {
  id: 'G-Trening',
  title: 'G · Trening - klipy z treningu ze zwolnieniem na wsadach, bilans, starcie, godzina, plakat',
  requires: (m) => (!m.training?.shots.length ? 'brak „training” (klipy z treningu w public/footage)' : null),
  shots: (m) => [
    ...m.training!.shots.map((s): Shot => ({ len: shotLen(s), el: <Training s={s} len={shotLen(s)} /> })),
    { len: 54, el: <Matchup len={54} />, wipe: true },
    { len: 54, el: <When len={54} /> },
    { len: 90, el: <EndCard />, wipe: true },
  ],
};
