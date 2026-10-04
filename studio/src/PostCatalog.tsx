import { compositionLabel } from '../../backend/studio/post-types.js';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import { postTypes as defaults, visualStyles } from '../../backend/studio/contracts.js';
import type { PostType } from './types';
import './post-catalog.css';
export default function PostCatalog({ posts, busy, onCreate }: { posts: PostType[]; busy: boolean; onCreate: (id: string, style: string) => void }) {
  const [search,setSearch]=useState(''); const [category,setCategory]=useState('Wszystkie'); const [selected,setSelected]=useState<PostType|null>(null);
  const list=posts.length?posts:defaults as PostType[];
  const categories=['Wszystkie',...new Set(list.map(p=>p.category))];
  const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
  const matching=list.filter(p=>(category==='Wszystkie'||p.category===category)&&normalize(`${p.label} ${p.category} ${p.id==='final'?'wygrana porażka':''}`).includes(normalize(search)));
  if (selected) return <><button className="text-button" onClick={()=>setSelected(null)}><ArrowLeft size={15}/>Typy publikacji</button><h3>{selected.label}</h3><p className="muted small">Wybierz kompozycję. Stroje A/B ustawisz osobno w edytorze.</p><div className="composition-grid">{visualStyles.filter(style=>selected.styles.includes(style.id)).map(style=><button key={style.id} disabled={busy} onClick={()=>onCreate(selected.id,style.id)}><img src={`/designs/${selected.id}-${style.id}.webp`} alt={`${selected.label} — ${style.label}`}/><h3>{compositionLabel(selected,style.id)}</h3><p>{selected.family==='announcement' && style.id==='editorial' ? 'Data konturem i mecz w panelu 24°.' : style.description}</p><span className="template-meta">Wybierz kompozycję <ArrowUpRight size={16}/></span></button>)}</div><p className="muted small">Miniatury przedstawiają przykładowe dane. Projekt rozpoczyna się z pustymi polami. Nowe kompozycje wymagają Twojego zatwierdzenia.</p></>;
  return <><label className="catalog-search"><Search size={16}/><input aria-label="Szukaj typu publikacji" placeholder="MVP, urodziny, tabela, wynik…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="catalog-categories" role="group" aria-label="Kategorie publikacji">{categories.map(c=><button key={c} aria-pressed={category===c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="publication-grid">{matching.map(p=><button key={p.id} disabled={busy} onClick={()=>setSelected(p)}><img src={`/designs/${p.id}-${p.styles[0]}.webp`} alt="" loading="lazy"/><span className="eyebrow">{p.category}</span><h3>{p.label}</h3><p>{p.id==='final'?'Wygrana lub porażka wynika z punktów.':`${p.styles.length} kompozycje · do oceny wizualnej`}</p><ArrowUpRight size={16}/></button>)}</div>{!matching.length&&<p className="muted">Brak pasujących typów publikacji.</p>}</>;
}
