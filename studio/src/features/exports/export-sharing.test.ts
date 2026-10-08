import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareExport, prepareExportFile, shareExportFile } from './export-sharing';

const output = { key: 'story-1', name: 'relacja-1080x1920.png', mime: 'image/png', width: 1080, height: 1920 };
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sharing original exports on iPhone', () => {
  it('prepares the authenticated PNG without resizing or converting its bytes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(bytes, { headers: { 'Content-Type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const file = await prepareExportFile('export-job', output, controller.signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/studio/v1/jobs/export-job/files/story-1', {
      credentials: 'same-origin',
      signal: controller.signal,
    });
    expect(file.name).toBe(output.name);
    expect(file.type).toBe('image/png');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
  });

  it('does not share an error page or an expired export as an image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('expired', { status: 404 })));
    await expect(prepareExportFile('expired-job', output)).rejects.toThrow('Nie udało');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    await expect(prepareExportFile('export-job', output)).rejects.toThrow('właściwego pliku');
  });

  it('calls native share immediately with only the prepared image, retaining tap activation', async () => {
    const file = new File([bytes], output.name, { type: output.mime });
    const share = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { share });
    const result = shareExportFile(file);
    expect(share).toHaveBeenCalledWith({ files: [file] });
    expect(fetchMock).not.toHaveBeenCalled();
    await result;
  });

  it('treats cancelling the share sheet as a normal action but reports provider errors', async () => {
    const file = new File([bytes], output.name, { type: output.mime });
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')) });
    await expect(shareExportFile(file)).resolves.toBeUndefined();
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Blocked', 'NotAllowedError')) });
    await expect(shareExportFile(file)).rejects.toThrow('Blocked');
  });

  it('falls back when file sharing is missing, refused or throws', () => {
    const file = new File([bytes], output.name, { type: output.mime });
    for (const nav of [
      {},
      { share: vi.fn(), canShare: () => false },
      {
        share: vi.fn(),
        canShare: () => {
          throw new Error('Unsupported');
        },
      },
    ]) {
      vi.stubGlobal('navigator', nav);
      expect(canShareExport(file)).toBe(false);
    }
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share: vi.fn(), canShare });
    expect(canShareExport(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
  });
});
