import { fail } from './config.js';
import { isClub, matchSnapshot } from './sources.js';
const row=(label,value,detail='')=>({label,value:String(value),detail});
const number=v=>v!=null && v!=='' && Number.isFinite(Number(v));
export async function statisticalSnapshot(db, kind, seasonId, id, subjectId='', view='team') {
  if(view==='player' && !subjectId) fail(400,'Wybierz zawodnika w tym meczu');
  if (!seasonId) fail(400,'Wybierz sezon');
  if (kind==='standings') {
    const teams=await db.leagueTeam.findMany({where:{seasonId,phase:'regular'},orderBy:{position:'asc'}});
    if (!teams.length) fail(404,'Brak tabeli tego sezonu');
    return {id:seasonId,seasonId,title:'TABELA LIGI',tableRows:teams.map(t=>row(`${t.position ?? '—'}. ${t.name}`,t.points,`${t.matches} M · ${t.wins} W · ${t.losses} P`)),statScope:'season'};
  }
  if (kind==='season' || kind==='round') {
    const raw=await db.leagueMatch.findMany({where:{seasonId,isFinished:true,...(kind==='round'?{phaseLabel:id}:{})},orderBy:{date:'asc'}});
    const played=raw.filter(m=>number(m.scoreHome)&&number(m.scoreAway));
    if (kind==='round') {
      if (!played.length) fail(404,'Brak zakończonych meczów tej kolejki');
      return {id,seasonId,title:`PODSUMOWANIE KOLEJKI ${id}`,statScope:'match',tableRows:played.map(m=>row(`${m.homeTeam} / ${m.guestTeam}`,`${m.scoreHome}:${m.scoreAway}`))};
    }
    const club=played.filter(m=>isClub(m.homeTeam)||isClub(m.guestTeam)).map(matchSnapshot);
    if (!club.length) fail(404,'Brak zakończonych meczów BeKaPaKa w tym sezonie');
    return {id:seasonId,seasonId,title:'PODSUMOWANIE SEZONU',statScope:'season',body:'Rozegrane mecze ze źródła KALK. Stan na dzień przygotowania materiału.',tableRows:[row('MECZE',club.length),row('WYGRANE',club.filter(m=>m.scoreUs>m.scoreThem).length),row('PORAŻKI',club.filter(m=>m.scoreUs<m.scoreThem).length),row('PUNKTY',club.reduce((s,m)=>s+m.scoreUs,0)),row('PPG',(club.reduce((s,m)=>s+m.scoreUs,0)/club.length).toFixed(1))]};
  }
  const match=await db.kalkMatch.findUnique({where:{seasonId_id:{seasonId,id}}});
  if (!match || !match.isFinished) fail(404,'Brak zakończonego meczu ze statystykami');
  const data=matchSnapshot(match),team=match.boxScore?.teams?.find(t=>isClub(t.name));
  if (!team) fail(404,'Brak publicznych statystyk BeKaPaKa');
  const logs=await db.kalkPlayerGameLog.findMany({where:{seasonId,kalkMatchId:id},include:{kalkPlayer:{select:{name:true}}}});
  const people=logs.filter(l=>isClub(l.teamName));
  if (subjectId) {
    const person=people.find(p=>p.kalkPlayerId===subjectId);
    if (!person) fail(404,'Zawodnik nie ma statystyk w tym meczu');
    return {...data,subjectId,view:'player',title:person.kalkPlayer.name,statScope:'match',tableRows:['pts','reb','ast'].filter(k=>number(person.stats?.[k])).map(k=>row(k.toUpperCase(),person.stats[k]))};
  }
  // Team totals must exist in the source; never silently fill missing fields with zero.
  const stats=team.stats || team.teamStats || team;
  const teamRows=['pts','reb','ast','stl','blk','tov'].flatMap(k=>{
    if(number(stats[k])) return [row(k.toUpperCase(),stats[k])];
    if(k!=='pts' && people.length && people.every(p=>number(p.stats?.[k]))) return [row(k.toUpperCase(),people.reduce((sum,p)=>sum+Number(p.stats[k]),0),'SUMA STATYSTYK ZAWODNIKÓW')];
    return [];
  });
  const leaders=['pts','reb','ast'].flatMap(k=>{const eligible=people.filter(p=>number(p.stats?.[k]));if(!eligible.length)return [];const best=Math.max(...eligible.map(p=>Number(p.stats[k])));return eligible.filter(p=>Number(p.stats[k])===best).map(p=>row(p.kalkPlayer.name,best,k.toUpperCase()));});
  return {...data,view,title:view==='leaders'?'LIDERZY MECZU':'STATYSTYKI MECZU',statScope:'match',tableRows:view==='leaders'?leaders:teamRows,subjects:people.map(p=>({id:p.kalkPlayerId,name:p.kalkPlayer.name}))};
}
