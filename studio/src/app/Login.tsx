import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { message, send } from '../lib/api';
import type { User } from '../lib/types';

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError('');
    const f = new FormData(form);
    try {
      const v = await send<{ user: User }>('/auth/login', { username: f.get('username'), password: f.get('password') });
      onLogin(v.user);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <div className="login-art">
        <img src="/brand/herb2-kolor.svg" alt="BeKaPaKa Bobolice" />
        <h1>
          NASZ KLUB.
          <br />
          NASZ OBRAZ.
        </h1>
        <div className="hero-stripes" />
      </div>
      <section className="login-form">
        <span className="eyebrow">BEKAPAKA STUDIO / SYSTEM 2.0</span>
        <h2>Wracamy do gry.</h2>
        <p>
          Prywatna pracownia publikacji BeKaPaKa.
          <br />
          Zaloguj się swoim kontem klubowym.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e.currentTarget);
          }}
        >
          <label>
            Login
            <input name="username" autoComplete="username" required maxLength={100} />
          </label>
          <label>
            Hasło
            <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Logowanie…' : 'Otwórz Studio'}
            <ArrowUpRight size={18} />
          </button>
        </form>
        <small>Grafiki, opisy i publikacje klubu w jednym miejscu.</small>
      </section>
    </main>
  );
}
