import { useEffect, useState } from 'react';
import { Download, ImageDown, Share2 } from 'lucide-react';
import { fileUrl } from './api';
import { canShareExport, prepareExportFile, shareExportFile } from './export-sharing';
import type { Output } from './types';
import './export-file.css';

export default function ExportFile({ jobId, output, onError }: { jobId: string; output: Output; onError: (message: string) => void }) {
  const url = fileUrl(jobId, output.key);
  const image = output.mime === 'image/png';
  const supported = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
  const [prepared, setPrepared] = useState<{ url: string; file: File | null } | null>(null);
  const [sharing, setSharing] = useState(false);
  const file = prepared?.url === url ? prepared.file : null;
  const loading = supported && prepared?.url !== url;

  useEffect(() => {
    if (!supported) return;
    let active = true;
    const controller = new AbortController();
    setPrepared(null);
    prepareExportFile(jobId, output, controller.signal).then(file => {
      if (active) setPrepared({ url, file: canShareExport(file) ? file : null });
    }).catch(() => { if (active) setPrepared({ url, file: null }); });
    return () => { active = false; controller.abort(); };
  }, [jobId, output.key, output.name, output.mime, supported]);

  return <div className="export-file">
    <div className="download-row"><a href={fileUrl(jobId, output.key, true)}><Download size={14}/>{output.key === 'zip' ? 'Pobierz paczkę ZIP' : output.name}</a></div>
    {(file || loading) ? <button className="secondary export-file-action" disabled={loading || sharing} onClick={async () => {
      if (!file) return;
      setSharing(true);
      try { await shareExportFile(file); }
      catch { onError('Nie udało się udostępnić pliku. Skorzystaj z otwierania obrazu lub pobierania.'); }
      finally { setSharing(false); }
    }}>{image ? <ImageDown size={16}/> : <Share2 size={16}/>} {loading ? 'Przygotowywanie pliku…' : sharing ? 'Udostępnianie…' : image ? 'Zapisz w Zdjęciach' : 'Udostępnij ZIP'}</button> : image && <a className="secondary export-file-action" href={url} target="_blank" rel="noopener noreferrer"><ImageDown size={16}/>Zapisz w Zdjęciach</a>}
    {image && <div className="export-file-help"><span>Na iPhonie wybierz „Zachowaj obraz”. Możesz też otworzyć i przytrzymać obraz.</span><a href={url} target="_blank" rel="noopener noreferrer">Otwórz obraz</a></div>}
  </div>;
}

// Mount file preparation only for the selected archive entry, not all exports.
export function ArchivedExportImages({ jobId, files, onError }: { jobId: string; files: Output[]; onError: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const images = files.filter(file => file.mime === 'image/png');
  if (!images.length) return null;
  return <details className="export-images" onToggle={event => setOpen(event.currentTarget.open)}><summary>Grafiki · zapisz w Zdjęciach</summary>{open && images.map(output => <ExportFile key={output.key} jobId={jobId} output={output} onError={onError}/>)}</details>;
}
