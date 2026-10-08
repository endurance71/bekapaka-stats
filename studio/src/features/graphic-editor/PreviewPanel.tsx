import { useEffect, useState } from 'react';
import { Eye, LoaderCircle, Monitor, RefreshCw, Smartphone, X } from 'lucide-react';
import { fileUrl } from '../../lib/api';
import { formatSpec } from '../../lib/contracts';
import type { Job } from '../../lib/types';
import SocialPreview, { PreviewOptions, type PreviewPlatform } from './SocialPreview';
import { useEditor } from './editor-context';

type Props = { preview: Job | null; format: string; current: boolean; onRefresh: () => void };

export default function PreviewPanel({ preview, format, current, onRefresh }: Props) {
  const { d, busy, readonly } = useEditor();
  const [phone, setPhone] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [platform, setPlatform] = useState<PreviewPlatform>('artwork');
  const [safeZones, setSafeZones] = useState(false);
  const [slide, setSlide] = useState(0);
  const outputs = preview?.result?.files || [];
  const image = outputs[Math.min(slide, outputs.length - 1)];
  const spec = formatSpec(format);

  useEffect(() => setSlide(0), [preview?.id]);
  useEffect(() => {
    if (!fullscreen) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [fullscreen]);

  const options = (
    <PreviewOptions
      platform={platform}
      onPlatform={setPlatform}
      safeZones={safeZones}
      onSafeZones={setSafeZones}
      story={format === 'story'}
    />
  );
  const artwork = image && preview && (
    <SocialPreview
      src={fileUrl(preview.id, image.key)}
      alt={d.altText || 'Roboczy podgląd grafiki'}
      format={format}
      platform={platform}
      safeZones={safeZones}
      caption={d.caption}
      stale={!current}
      phone={phone}
    />
  );
  const status = readonly
    ? image
      ? `Ostatni zapisany podgląd · rewizja ${preview?.revision}`
      : 'Projekt zarchiwizowany'
    : current
      ? `Podgląd rewizji ${preview?.revision}`
      : 'Podgląd roboczy · zmiany w toku';

  return (
    <section className={`preview-panel ${phone ? 'phone-preview' : ''}`}>
      <div className="preview-toolbar">
        <span className="eyebrow">
          PODGLĄD / {spec.width} × {spec.height}
        </span>
        <div>
          <button className="icon-button" aria-label="Odśwież podgląd" disabled={busy || readonly} onClick={onRefresh}>
            <RefreshCw size={17} />
          </button>
          <button
            className={!phone ? 'selected icon-button' : 'icon-button'}
            aria-label="Duży podgląd"
            onClick={() => setPhone(false)}
          >
            <Monitor size={17} />
          </button>
          <button
            className={phone ? 'selected icon-button' : 'icon-button'}
            aria-label="Podgląd 360 pikseli"
            onClick={() => setPhone(true)}
          >
            <Smartphone size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Pełny ekran"
            disabled={!artwork}
            onClick={() => setFullscreen(true)}
          >
            <Eye size={17} />
          </button>
        </div>
      </div>
      {options}
      <div className="preview-stage">
        {artwork || (
          <div className="preview-empty">
            <img src="/brand/sygnet2-kolor.svg" alt="" />
            <p>
              {preview?.status === 'failed'
                ? 'Popraw dane, aby zobaczyć podgląd'
                : readonly
                  ? 'Projekt zarchiwizowany — podgląd niedostępny. Przywróć projekt lub utwórz kopię, aby wygenerować nowy.'
                  : 'Składam Twój materiał…'}
            </p>
          </div>
        )}
        {preview && ['queued', 'running'].includes(preview.status) && (
          <div className="preview-badge">
            <LoaderCircle size={14} className="spin" />
            Odświeżam podgląd
          </div>
        )}
      </div>
      {preview?.status === 'failed' && <p className="form-error render-error">{preview.error}</p>}
      <div className="preview-caption">
        <span>{status}</span>
        {outputs.length > 1 && (
          <div>
            {outputs.map((_, i) => (
              <button
                key={i}
                className={slide === i ? 'selected' : ''}
                aria-label={`Slajd ${i + 1}`}
                onClick={() => setSlide(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        <span>{phone ? 'Szerokość do 360 px' : 'Ten sam renderer co w eksporcie'}</span>
      </div>
      {platform !== 'artwork' && (
        <p className="social-preview-note">
          Symulacja interfejsu na telefonie. Wygląd kontrolek zależy od wersji aplikacji. Nakładki nie trafiają do
          eksportu.
        </p>
      )}
      {fullscreen && (
        <div className="fullscreen-preview" role="dialog" aria-modal="true" aria-label="Pełnoekranowy podgląd">
          <button className="icon-button" aria-label="Zamknij podgląd" autoFocus onClick={() => setFullscreen(false)}>
            <X />
          </button>
          {options}
          {artwork}
          {platform !== 'artwork' && (
            <p className="social-preview-note">Symulacja interfejsu · nakładki nie trafiają do eksportu.</p>
          )}
        </div>
      )}
    </section>
  );
}
