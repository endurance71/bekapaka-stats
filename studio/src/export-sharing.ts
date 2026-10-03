import { fileUrl } from './api';
import type { Output } from './types';

// Prepare the original file before the tap: awaiting a fetch inside the click
// handler can lose Safari's transient user activation required by Web Share.
export async function prepareExportFile(jobId: string, output: Output, signal?: AbortSignal): Promise<File> {
  const response = await fetch(fileUrl(jobId, output.key), { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error('Nie udało się przygotować pliku. Otwórz obraz lub pobierz go ponownie.');
  const blob = await response.blob();
  if (blob.type.split(';')[0] !== output.mime) throw new Error('Serwer nie zwrócił właściwego pliku eksportu.');
  return new File([blob], output.name, { type: output.mime });
}

export function canShareExport(file: File): boolean {
  try { return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }); }
  catch { return false; }
}

export async function shareExportFile(file: File): Promise<void> {
  try {
    // Send the PNG itself, without a URL or ZIP, so iOS offers image actions.
    await navigator.share({ files: [file] });
  } catch (error) {
    if ((error as Error).name !== 'AbortError') throw error;
  }
}
