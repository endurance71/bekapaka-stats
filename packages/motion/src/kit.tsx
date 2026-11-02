import React from 'react';
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { fitSize } from './match';

// Fonty marki z public/brand (kopiuje je scripts/prepare.mjs z backend/studio/brand).
const fontsReady = delayRender('fonts');
Promise.all(
  [
    ['BC', 'BarlowCondensed-ExtraBold.ttf', '800'],
    ['Barlow', 'Barlow-SemiBold.ttf', '600'],
    ['Barlow', 'Barlow-Regular.ttf', '400'],
  ].map(([family, file, weight]) => new FontFace(family, `url(${staticFile(`brand/${file}`)})`, { weight }).load().then((ff) => document.fonts.add(ff))),
).then(() => continueRender(fontsReady));

export const brand = (file: string) => staticFile(`brand/${file}`);

/** Kolory z backend/studio/brand/02_system/tokens.json. */
export const C = { black: '#0B0B0B', red: '#EF1734', redDark: '#AE1027', white: '#F7F6F2', paper: '#F3F1EC', gold: '#F4A816', muted: '#9C978F' };

/** Szerokość tekstu w kadrze 1080: margines 70 px z każdej strony. */
export const MAX_W = 940;

// Ruch: wejścia „wygasające” (szybki start, długie osiadanie, bez przestrzału), wyjścia z przyspieszeniem.
export const decay = Easing.bezier(0.16, 1, 0.3, 1);
export const accel = Easing.bezier(0.7, 0, 0.84, 0);
export const p = (f: number, s: number, d: number, e = decay) =>
  interpolate(f, [s, s + d], [0, 1], { easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Krótki wstrząs po uderzeniu (VS, przekreślenie, pieczątka). */
export const shakeAt = (f: number, at: number, len = 8, amp = 1.4) => (f >= at && f < at + len ? Math.sin((f - at) * 2.6) * (at + len - f) * amp : 0);

/** Zdarty nadruk - ta sama faktura co filtr „nadruk” w grafikach Studio. */
export const wear: React.CSSProperties = {
  WebkitMaskImage: `url(${brand('przetarcia-maska.png')})`,
  WebkitMaskSize: '1080px 1920px',
  WebkitMaskPosition: '0 0',
};

/** Duży wiersz; litery wyrastają z maski jedna po drugiej. Rozmiar maleje, gdy tekst się nie mieści. */
export const Big: React.FC<{
  text: string; f: number; at: number; y: number; size: number; color?: string; stagger?: number; shadow?: boolean;
  align?: 'center' | 'flex-start'; x?: number; outline?: boolean; maxWidth?: number;
}> = ({ text, f, at, y, size: wanted, color = C.white, stagger = 1.2, shadow = true, align = 'center', x = 0, outline = false, maxWidth }) => {
  const size = fitSize(text, wanted, maxWidth ?? (align === 'center' ? MAX_W : 1080 - x - 70));
  return (
    <div style={{ position: 'absolute', left: x, right: align === 'center' ? x : 0, top: y + (wanted - size) * 0.5, height: size * 0.95, overflow: 'hidden', display: 'flex', justifyContent: align }}>
      <div style={{ display: 'flex', transform: 'skewX(-9deg)', filter: shadow ? 'drop-shadow(0 10px 14px rgba(0,0,0,.65))' : undefined }}>
        {[...text].map((ch, i) => {
          const t = p(f, at + i * stagger, 10);
          return (
            <span key={i} style={{
              fontFamily: 'BC', fontWeight: 800, fontSize: size, lineHeight: 0.95, whiteSpace: 'pre', display: 'inline-block',
              color: outline ? 'transparent' : color, WebkitTextStroke: outline ? `${Math.max(4, size / 45)}px ${color}` : undefined,
              transform: `translateY(${(1 - t) * size * 0.9}px)`,
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
};

/** Słowo, które ląduje z uderzeniem skali. */
export const Slam: React.FC<{ text: string; f: number; at: number; y: number; size: number; color?: string; from?: number; shadow?: boolean }> = ({
  text, f, at, y, size: wanted, color = C.white, from = 2, shadow = true,
}) => {
  const t = p(f, at, 7);
  const size = fitSize(text, wanted, MAX_W);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: y + (wanted - size) * 0.5, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: size, lineHeight: 0.95,
      whiteSpace: 'nowrap', color, opacity: Math.min(1, t * 3), transform: `skewX(-9deg) scale(${lerp(from, 1, t)})`,
      filter: shadow ? 'drop-shadow(0 12px 16px rgba(0,0,0,.75))' : undefined,
    }}>{text}</div>
  );
};

/** Etykieta Barlow SemiBold z rozstrzeleniem; wchodzi od 40% krycia, wcześniej niewidoczna. */
export const Label: React.FC<{ text: string; f: number; at: number; y: number; size?: number; color?: string; align?: 'center' | 'left'; x?: number; maxWidth?: number }> = ({
  text, f, at, y, size: wanted = 44, color = C.white, align = 'center', x = 0, maxWidth,
}) => {
  const t = p(f, at, 12);
  const size = fitSize(text, wanted, maxWidth ?? (align === 'center' ? MAX_W : 1080 - x - 70), 'label', 0.22);
  return (
    <div style={{
      position: 'absolute', left: x, right: align === 'center' ? x : undefined, top: y + (wanted - size) * 0.5, textAlign: align, fontFamily: 'Barlow', fontWeight: 600, fontSize: size,
      letterSpacing: size * 0.22, color, opacity: f < at ? 0 : 0.4 + 0.6 * t, transform: `translateY(${(1 - t) * 26}px)`, whiteSpace: 'nowrap',
    }}>{text}</div>
  );
};

/** Faktura tła: płyta (czerń) albo papier składu. */
export const Plate: React.FC<{ dim?: number; src?: string; drift?: number; url?: string }> = ({ dim = 0.55, src = 'plyta-czarna.png', drift = 0, url }) => (
  <AbsoluteFill>
    <Img src={url ?? brand(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - 0.08 * drift})` }} />
    <AbsoluteFill style={{ backgroundColor: src.includes('paper') ? C.paper : C.black, opacity: dim }} />
  </AbsoluteFill>
);

/** Trzy paski stroju (krycie 0,45 / 0,73 / 1 jak w stopce Studio). */
export const Stripes: React.FC<{ f: number; at: number; y: number; x?: number; w?: number }> = ({ f, at, y, x = 72, w = 936 }) => (
  <>
    {[0.45, 0.73, 1].map((o, i) => (
      <div key={i} style={{ position: 'absolute', left: x, top: y + i * 16, height: 6, width: w * p(f, at + i * 3, 14), backgroundColor: C.red, opacity: o }} />
    ))}
  </>
);

/** Powolny najazd kamery, żeby żadna scena nie stała w miejscu. */
export const Push: React.FC<{ f: number; len: number; amount?: number; children: React.ReactNode }> = ({ f, len, amount = 0.05, children }) => (
  <AbsoluteFill style={{ transform: `scale(${1 + amount * p(f, 0, len, Easing.linear)})` }}>{children}</AbsoluteFill>
);

const BladeInner: React.FC<{ color: string }> = ({ color }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 8, 16], [-2400, -300, 1500], { easing: Easing.inOut(Easing.cubic), extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -200, left: x, width: 1800, height: 2400, backgroundColor: color, transform: 'skewX(-24deg)' }} />
      {[0.45, 0.73, 1].map((o, i) => (
        <div key={i} style={{ position: 'absolute', top: -200, left: x - 60 - i * 34, width: 14, height: 2400, backgroundColor: color, opacity: o, transform: 'skewX(-24deg)' }} />
      ))}
    </AbsoluteFill>
  );
};

/** Czerwone ostrze pod kątem stroju (24°); zakrywa kadr w 8. klatce - tam leży cięcie. */
export const BladeWipe: React.FC<{ color?: string }> = ({ color = C.red }) => (
  <CameraMotionBlur samples={8} shutterAngle={200}>
    <BladeInner color={color} />
  </CameraMotionBlur>
);

/** Cyfra na rolce; szerokość kolumny wyznacza cyfra końcowa (bez skoków odstępów). */
export const Digit: React.FC<{ final: number; f: number; at: number; size: number; dur?: number }> = ({ final, f, at, size, dur = 20 }) => {
  const turns = 12 + final;
  const t = p(f, at, dur);
  const h = size * 0.95;
  return (
    <div style={{ height: h, overflow: 'hidden', display: 'inline-block', position: 'relative' }}>
      <span style={{ visibility: 'hidden', lineHeight: `${h}px` }}>{final}</span>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: `translate(-50%, ${-(turns - turns * t) * h}px)`, textAlign: 'center' }}>
        {Array.from({ length: turns + 1 }, (_, i) => (
          <div key={i} style={{ height: h, lineHeight: `${h}px` }}>{(final + i) % 10}</div>
        ))}
      </div>
    </div>
  );
};

/** Godzina „HH:MM” na rolkach. */
export const Clock: React.FC<{ time: string; f: number; at: number; size: number }> = ({ time, f, at, size }) => (
  <>
    {[...time].map((ch, i) =>
      ch === ':' ? <span key={i} style={{ lineHeight: `${size * 0.95}px` }}>:</span> : <Digit key={i} final={Number(ch)} f={f} at={at + i * 2} size={size} />,
    )}
  </>
);

/** Liczba odliczana od zera. */
export const Count: React.FC<{ to: number; f: number; at: number; dur?: number }> = ({ to, f, at, dur = 22 }) => (
  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(to * p(f, at, dur))}</span>
);

/** Herb 2.0 z napisem BOBOLICE - jedyny znak klubu we wzorach. */
export const Crest: React.FC<{ style?: React.CSSProperties }> = ({ style }) => <Img src={brand('herb2-kolor.svg')} style={{ position: 'absolute', ...style }} />;

/** Znak rywala wycięty z grafiki Studio (logo z rejestru albo tarcza ze skrótem). */
export const Rival: React.FC<{ svg: string; style?: React.CSSProperties; width: number }> = ({ svg, style, width }) => (
  <svg viewBox="660 596 300 330" width={width} height={(width * 330) / 300} style={{ position: 'absolute', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
);
