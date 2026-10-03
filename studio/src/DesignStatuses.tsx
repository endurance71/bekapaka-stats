import { send } from './api';
import { formats, visualStyles } from '../../backend/studio/contracts.js';
import type { PostType } from './types';
const labels:Record<string,string>={draft:'Do oceny',approved:'Zatwierdzony',retired:'Wycofany'};
export default function DesignStatuses({posts,reload,onError}:{posts:PostType[];reload:()=>Promise<void>;onError:(s:string)=>void}){
 return <section><div className="section-title"><h2>Typy publikacji i kompozycje</h2><span className="muted">Zatwierdzenie dotyczy konkretnej kompozycji i formatu.</span></div>{posts.map(p=><details key={p.id} className="design-status-group"><summary>{p.label} · {p.version}</summary><div className="template-statuses">{p.designs?.map(d=><div key={`${d.style}-${d.format}`}><b>{visualStyles.find(s=>s.id===d.style)?.label} · {formats[d.format as keyof typeof formats].label}</b><span className={`status status-${d.status}`}>{labels[d.status]}</span><button className="text-button" onClick={async()=>{try{await send(`/designs/${p.id}/${d.style}/${d.format}/status`,{status:d.status==='retired'?'draft':'retired'});await reload();}catch(e){onError((e as Error).message);}}}>{d.status==='retired'?'Przywróć roboczy':'Wycofaj'}</button></div>)}</div></details>)}</section>;
}
