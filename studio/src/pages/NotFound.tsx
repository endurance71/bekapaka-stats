import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="empty">
      <h3>Nie ma takiej strony</h3>
      <p>Adres mógł się zmienić po aktualizacji Studio.</p>
      <Link className="secondary" to="/grafiki">
        Wróć do grafik
      </Link>
    </div>
  );
}
