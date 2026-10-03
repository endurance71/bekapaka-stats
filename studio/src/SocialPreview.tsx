import type { CSSProperties } from 'react';
import { Heart, Send, MoreHorizontal, X, Volume2, Bookmark, MessageCircle, ThumbsUp, Share2, ChevronLeft, Camera } from 'lucide-react';
import { formats } from '../../backend/studio/contracts.js';
import './social-preview.css';

export type PreviewPlatform = 'artwork' | 'instagram' | 'facebook';
type Props = { src: string; alt: string; format: string; platform: PreviewPlatform; safeZones: boolean; caption: string; stale: boolean; phone: boolean };
export function PreviewOptions({ platform, onPlatform, safeZones, onSafeZones, story }: {
  platform: PreviewPlatform; onPlatform: (value: PreviewPlatform) => void; safeZones: boolean; onSafeZones: (value: boolean) => void; story: boolean;
}) {
  return <div className="social-options">
    <div className="social-switch" role="group" aria-label="Sposób podglądu">
      {([['artwork', 'Grafika'], ['instagram', 'Instagram'], ['facebook', 'Facebook']] as const).map(([value, label]) =>
        <button key={value} aria-pressed={platform === value} onClick={() => onPlatform(value)}>{label}</button>)}
    </div>
    {story && <label className="social-safe-toggle"><input type="checkbox" checked={safeZones} onChange={e => onSafeZones(e.target.checked)}/>Strefy bezpieczne</label>}
  </div>;
}
function Avatar() { return <span className="social-avatar"><img src="/brand/sygnet2-kolor.svg" alt=""/></span>; }
export default function SocialPreview({ src, alt, format, platform, safeZones, caption, stale, phone }: Props) {
  const spec = formats[format as keyof typeof formats]; const story = format === 'story';
  const style = { '--art-ratio': spec.width / spec.height } as CSSProperties;
  const image = <img className={`social-artwork ${stale ? 'stale-preview' : ''}`} src={src} alt={alt} width={spec.width} height={spec.height}/>;
  const guide = story && safeZones && <div className="social-safe-guide" aria-label="Strefa informacji: 72–1008 px poziomo, 260–1600 px pionowo"><div className="safe-top"><span>Górny interfejs · 260 px</span></div><div className="safe-center"/><div className="safe-bottom"><span>Dolny interfejs · 320 px</span></div></div>;
  if (platform === 'artwork') return <div className={`artwork-preview ${phone ? 'at-phone-width' : ''}`} style={style}>{image}{guide}</div>;
  if (story) return <div className={`social-device story-device ${platform}`} style={style} aria-label={`Symulacja relacji ${platform === 'instagram' ? 'Instagram' : 'Facebook'}`}>
    <div className="story-status-space" aria-hidden="true"/>
    <div className="story-media">{image}{guide}
      <div className="story-ui-top" aria-hidden="true">
        <div className="story-progress"><i/><i/><i/></div>
        <div className="story-account"><Avatar/><div><strong>BeKaPaKa Bobolice</strong><small>Przed chwilą</small></div><Volume2/><MoreHorizontal/><X/></div>
      </div>
    </div>
    <div className="story-ui-bottom" aria-hidden="true">
      <span className="story-reply">{platform === 'instagram' ? 'Wyślij wiadomość…' : 'Odpowiedz…'}</span>
      {platform === 'instagram' ? <><Heart/><Send/></> : <><ThumbsUp/><Heart/></>}
    </div>
    <div className="phone-home" aria-hidden="true"/>
  </div>;
  return <div className={`social-device feed-device ${platform}`} style={style} aria-label={`Symulacja posta ${platform === 'instagram' ? 'Instagram' : 'Facebook'}`}>
    <div className="feed-app-bar" aria-hidden="true">{platform === 'instagram' ? <><ChevronLeft/><strong>Posty</strong><Camera/></> : <><strong>facebook</strong><MessageCircle/></>}</div>
    <div className="feed-account" aria-hidden="true"><Avatar/><div><strong>BeKaPaKa Bobolice</strong><small>{platform === 'facebook' ? 'Przed chwilą · Publiczny' : 'Bobolice'}</small></div><MoreHorizontal/></div>
    {platform === 'facebook' && <p className="feed-copy">{caption || 'Opis posta pojawi się tutaj.'}</p>}
    {image}
    {platform === 'instagram' ? <><div className="feed-actions" aria-hidden="true"><Heart/><MessageCircle/><Send/><Bookmark className="feed-save"/></div><p className="feed-copy"><strong>BeKaPaKa </strong>{caption || 'Opis posta pojawi się tutaj.'}</p></> : <div className="feed-facebook-actions" aria-hidden="true"><span><ThumbsUp/>Lubię to</span><span><MessageCircle/>Komentarz</span><span><Share2/>Udostępnij</span></div>}
  </div>;
}
