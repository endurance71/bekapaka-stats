import { useCatalog } from '../lib/queries';
import PageHeader from '../components/PageHeader';
import DesignStatuses from '../features/library/DesignStatuses';
import PartnerRegistry from '../features/library/PartnerRegistry';

const swatches = ['#0B0B0B', '#EF1734', '#F7F6F2', '#F3F1EC', '#F4A816'];

export default function BrandPage() {
  const catalog = useCatalog();
  return (
    <>
      <PageHeader title="System marki 2.0" />
      <section className="brand-rules">
        <img src="/brand/herb2-kolor.svg" alt="Znak 2.0" />
        <div>
          <span className="eyebrow">AKTYWNY PAKIET · {catalog.data?.brandVersion || '—'}</span>
          <h2>ZNAKI, KTÓRE NAS ŁĄCZĄ.</h2>
          <p>
            Barlow. Papier, farba i parkiet. Geometria 24° / 66°.
            <br />
            Jeden poziom partnerów, kolejność alfabetyczna.
          </p>
          <div className="swatches">
            {swatches.map((c) => (
              <span key={c}>
                <i style={{ background: c }} />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>
      <DesignStatuses />
      <PartnerRegistry />
    </>
  );
}
