"""Podkład do rolki „trening przedmeczowy” — syntetyzowany od zera (bez sampli), 100 BPM, A-moll.

Takt cięć filmu (30 kl./s, 18 klatek = 1 bit): drop na bicie 4 (2,4 s), akcenty cięć na bitach 6/10/14,
przerwa na „GOTOWI.” bity 18–19, drugi drop na VS (bit 20), uderzenie na plakacie (bit 26), koniec bit 30.
Użycie: python beat.py out.wav [długość_s]
"""
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 100
BEAT = 60 / BPM
S16 = BEAT / 4
LENGTH = float(sys.argv[2]) if len(sys.argv) > 2 else 18.6
N = int(LENGTH * SR) + SR * 3  # zapas na ogony, potem przycięcie
rng = np.random.default_rng(14)

L = np.zeros(N)
R = np.zeros(N)
REV_L = np.zeros(N)  # szyna pogłosu
REV_R = np.zeros(N)
DUCK = np.ones(N)  # sidechain od stopy


def t_of(n):
    return np.arange(n) / SR


def place(buf, x, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += x * gain


def add(x, at, gain=1.0, pan=0.0, rev=0.0):
    gl = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    gr = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    place(L, x, at, gl)
    place(R, x, at, gr)
    if rev:
        place(REV_L, x, at, gl * rev)
        place(REV_R, x, at, gr * rev)


def filt(x, kind, f, order=2):
    sos = signal.butter(order, f, kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def noise(n):
    return rng.standard_normal(n)


# ---------------- instrumenty ----------------
def kick(dur=0.5, punch=1.0):
    t = t_of(int(dur * SR))
    f = 46 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7)
    click = filt(noise(len(t)), 'highpass', 2500) * np.exp(-t * 400) * 0.35
    return np.tanh((body + click) * 1.6 * punch) * 0.95


def duck_at(at, depth=0.65, dur=0.32):
    i = int(at * SR)
    t = t_of(int(dur * SR))
    env = 1 - depth * np.exp(-t * 9)
    seg = DUCK[i: i + len(env)]
    DUCK[i: i + len(env)] = np.minimum(seg, env[: len(seg)])


def snare():
    t = t_of(int(0.35 * SR))
    tone = (np.sin(2 * np.pi * 190 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 28)
    nz = filt(noise(len(t)), 'bandpass', [1400, 9000]) * np.exp(-t * 16)
    return np.tanh((tone * 0.6 + nz * 0.9) * 1.3) * 0.8


def clap():
    t = t_of(int(0.4 * SR))
    env = np.zeros_like(t)
    for k, d in enumerate([0, 0.011, 0.022]):
        env += np.where(t >= d, np.exp(-(t - d) * 180), 0) * (0.8 if k < 2 else 1)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) * 14), 0) * 0.55
    return filt(noise(len(t)), 'bandpass', [900, 6000]) * env * 0.9


def hat(open_=False):
    d = 0.35 if open_ else 0.07
    t = t_of(int(d * SR))
    metal = sum(signal.square(2 * np.pi * f * t) for f in (3135, 4186, 5274, 6271, 7040)) / 5
    x = filt(metal * 0.5 + noise(len(t)) * 0.6, 'highpass', 7000)
    return x * np.exp(-t * (7 if open_ else 55)) * 0.32


def crash(dur=2.2):
    t = t_of(int(dur * SR))
    metal = sum(signal.square(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (3520, 4435, 5587, 6645, 8372)) / 5
    x = filt(noise(len(t)) + metal * 0.4, 'highpass', 4200)
    return x * np.exp(-t * 2.2) * 0.32


def boom(dur=1.8):
    t = t_of(int(dur * SR))
    f = 34 + 40 * np.exp(-t * 6)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    nz = filt(noise(len(t)), 'lowpass', 900) * np.exp(-t * 9) * 0.6
    return np.tanh((body + nz) * 2.0) * 0.9


def bass808(freq, dur):
    t = t_of(int((dur + 0.08) * SR))
    f = freq * (1 + 0.6 * np.exp(-t * 40))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 2.2)
    env *= np.clip((dur + 0.08 - t) / 0.08, 0, 1)
    x = np.tanh(x * env * 2.6)
    return filt(x, 'lowpass', 520) * 0.62


def saw(freq, t, detune=0.0):
    return signal.sawtooth(2 * np.pi * freq * (1 + detune) * t + rng.uniform(0, 6))


def stab(freqs, dur=0.22):
    t = t_of(int(dur * SR))
    x = sum(saw(f, t, d) for f in freqs for d in (-0.006, 0, 0.007)) / (3 * len(freqs))
    cutoff = 2600
    x = filt(x, 'lowpass', cutoff, 2)
    return x * np.minimum(1, t / 0.003) * np.exp(-t * 11) * 0.9


def pad(freqs, dur, cutoff=1300):
    t = t_of(int(dur * SR))
    x = sum(saw(f, t, d) for f in freqs for d in (-0.01, -0.004, 0.004, 0.01)) / (4 * len(freqs))
    x = filt(x, 'lowpass', cutoff, 2)
    env = np.minimum(1, t / 0.05) * np.clip((dur - t) / 0.08, 0, 1)
    return x * env * 0.45


def riser(dur):
    t = t_of(int(dur * SR))
    f = 180 * (12 ** (t / dur))
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    nz = filt(noise(len(t)), 'highpass', 1200) * 0.5
    return (sweep + nz) * (t / dur) ** 2.2 * 0.5


def whoosh(dur=0.35):
    t = t_of(int(dur * SR))
    x = filt(noise(len(t)), 'bandpass', [600, 5000]) * (t / dur) ** 3
    return x * 0.35


def reverse_crash(dur):
    return crash(dur + 0.4)[: int(dur * SR)][::-1] * 0.9


# ---------------- harmonia ----------------
def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


CHORDS = [  # (nuty akordu, bas) — Am, F, G, Em
    ([57, 60, 64], 33),
    ([53, 57, 60], 29),
    ([55, 59, 62], 31),
    ([52, 55, 59], 28),
]


def at_beat(b):
    return b * BEAT


# ---------------- aranżacja ----------------
# Intro (bity 0–4): pad przez filtr, hi-haty, werbel narastający, riser, przerwa przed dropem.
add(pad([hz(n) for n in CHORDS[0][0]], at_beat(4), cutoff=650), 0, 0.9, rev=0.3)
for k in range(8):
    add(hat(), at_beat(k * 0.5), 0.35 + 0.05 * k, pan=0.25)
for k in range(8, 15):
    add(hat(), at_beat(k * 0.25), 0.55, pan=0.25)
roll = [2 + i * 0.5 for i in range(2)] + [3 + i * 0.25 for i in range(3)] + [3.75 + i * 0.0625 for i in range(3)]
for i, b in enumerate(roll):
    add(snare(), at_beat(b), 0.25 + 0.07 * i, rev=0.25)
add(riser(at_beat(3.2)), at_beat(0.6), 0.9)
add(reverse_crash(at_beat(1)), at_beat(3), 0.8)


def impact(b, big=True):
    add(boom(), at_beat(b), 1.0 if big else 0.7)
    add(crash(), at_beat(b), 0.9 if big else 0.6, rev=0.4)
    add(kick(), at_beat(b), 1.0)
    duck_at(at_beat(b), 0.8, 0.6)


KICKS = [[0, 6, 10], [0, 3, 10, 13]]


def groove(b0, bars, last_bar_beats=4):
    for bar in range(bars):
        start = b0 + bar * 4
        chord, root = CHORDS[(start - 4) // 4 % 4]
        span = 4 if bar < bars - 1 else last_bar_beats
        # pad pod spodem, przyciszany przez stopę
        add(pad([hz(n) for n in chord], at_beat(span)), at_beat(start), 0.32, rev=0.25)
        steps = span * 4
        ks = [s for s in KICKS[bar % 2] if s < steps]
        for i, s in enumerate(ks):
            if bar == 0 and s == 0 and start in (4, 20):
                pass  # stopę na drop daje impact()
            else:
                add(kick(), at_beat(start + s / 4), 0.9)
            duck_at(at_beat(start + s / 4))
            nxt = ks[i + 1] if i + 1 < len(ks) else steps
            note = root + (12 if (bar % 2 and s == 13) else 0)
            add(bass808(hz(note + 12), (nxt - s) * S16 * 0.98), at_beat(start + s / 4), 0.7)
        for s in (4, 12):
            if s < steps:
                add(snare(), at_beat(start + s / 4), 0.55, rev=0.2)
                add(clap(), at_beat(start + s / 4), 0.6, pan=0.1, rev=0.35)
        for s in range(0, steps, 2):
            add(hat(), at_beat(start + s / 4), 0.5 if s % 4 else 0.38, pan=0.3)
        if bar % 2 == 1 and steps == 16:  # przejście: 16-tki i triola na końcu taktu
            for s in (13, 15):
                add(hat(), at_beat(start + s / 4), 0.42, pan=0.3)
            for k in range(3):
                add(hat(), at_beat(start + 3.5 + k / 6), 0.4, pan=-0.2)
        if bar % 2 == 0:
            add(hat(True), at_beat(start + 2.5), 0.35, pan=-0.3, rev=0.2)
        for s in (0, 3, 6, 10):
            if s < steps:
                add(stab([hz(n + 12) for n in chord]), at_beat(start + s / 4), 0.5, pan=-0.35 if s % 2 else 0.35, rev=0.3)


# Drop 1: bit 4, groove do bitu 18 (3 pełne takty + 2 bity).
impact(4)
groove(4, 4, last_bar_beats=2)
# Akcenty cięć (bity 6, 10, 14): świst w cięcie.
for b in (6, 10, 14):
    add(whoosh(), at_beat(b) - 0.35, 0.8, pan=0.2)

# Przerwa „GOTOWI.” (bity 18–20): pad, stopa przez filtr, werbel narastający, riser, przerwa przed VS.
add(pad([hz(n) for n in CHORDS[3][0]], at_beat(2), cutoff=700), at_beat(18), 0.55, rev=0.35)
add(filt(kick(), 'lowpass', 300), at_beat(18), 0.9)
add(bass808(hz(28 + 12), BEAT * 1.6), at_beat(18), 0.45)
for i, b in enumerate([19 + k * 0.125 for k in range(7)]):
    add(snare(), at_beat(b), 0.25 + 0.06 * i, rev=0.2)
add(riser(at_beat(2)), at_beat(18), 0.9)
add(reverse_crash(at_beat(1)), at_beat(19), 0.8)

# Drop 2: VS na bicie 20, groove do bitu 30, uderzenie na plakacie (bit 26).
impact(20)
groove(20, 3, last_bar_beats=2)
add(crash(), at_beat(26), 0.6, rev=0.4)
add(boom(), at_beat(26), 0.55)

# Koniec (bit 30): ostatnie uderzenie z akordem i wybrzmieniem.
impact(30)
add(bass808(hz(33 + 12), 1.2), at_beat(30), 0.9)
add(stab([hz(n + 12) for n in CHORDS[0][0]], 0.9), at_beat(30), 0.7, rev=0.6)

# ---------------- miks ----------------
L *= DUCK ** 0.6  # lekki „pump”: pad i stab oddychają z kick'iem (cały miks łagodniej)
R *= DUCK ** 0.6


def ir(seed):
    r = np.random.default_rng(seed)
    t = t_of(int(1.9 * SR))
    x = r.standard_normal(len(t)) * np.exp(-t * 3.2)
    return filt(x, 'lowpass', 5000) * 0.08


wet_l = signal.fftconvolve(filt(REV_L, 'highpass', 300), ir(1))[:N]
wet_r = signal.fftconvolve(filt(REV_R, 'highpass', 300), ir(2))[:N]
L += wet_l
R += wet_r

mix = np.stack([L, R], 1)
mix = filt(mix.T, 'highpass', 28).T
mix /= np.abs(mix).max() / 1.25
mix = np.tanh(mix)
n_out = int(LENGTH * SR)
mix = mix[:n_out]
fade = int(0.25 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.abs(mix).max() / 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'beat.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(out, f'{LENGTH:.2f}s')
