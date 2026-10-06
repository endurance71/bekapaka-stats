'use client'
export default function MatchError({ retry }: { retry: () => void }) {
  return <section className="container section" role="alert"><h1>Nie można pobrać meczu</h1><p>Spróbuj ponownie za chwilę.</p><button type="button" className="btn btn--primary" onClick={retry}>Spróbuj ponownie</button></section>
}
