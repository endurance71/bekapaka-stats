import { postTypes, newPostProject } from './contracts.js';
export function fixture(type, style='sport') {
 const project=newPostProject(type.id,style);
 Object.assign(project.content,{opponent:'Koszalin Basketball',opponentShort:'KBS',date:'2026-10-11T14:30:00+02:00',originalDate:'2026-10-04T12:00:00+02:00',venue:type.family==='tournament'?'CESiR Bobolice':['announcement','result','lineup'].includes(type.family)||['training','invitation'].includes(type.variant)?'KOSiR Koszalin':'',title:type.label.toUpperCase(),body:'Gramy razem. Widzimy się na parkiecie.',scoreUs:108,scoreThem:97,edition:3,teams:8,days:1,firstName:'Paweł',lastName:'Żółkiewicz',number:'24',position:'Rozgrywający',attribution:'Zawodnik BeKaPaKa',altText:'Przykładowa kompozycja materiału klubowego.',phase:'Przerwa',photoAssetId:'photo',kitBConfirmed:true,mvpConfirmed:true,lineupConfirmed:true});
 project.content.lineup=Array.from({length:type.variant==='five'?5:8},(_,i)=>({id:String(i),firstName:'Paweł',lastName:'Żółkiewicz',number:String(i+1),position:'PG'}));
 project.content.schedule=Array.from({length:8},(_,i)=>({date:'2026-10-11T14:30:00+02:00',opponent:'Koszalin Basketball',round:String(i+1)}));
 project.content.slides=Array.from({length:4},()=>({title:'GRAMY RAZEM',body:'Energia zespołu na parkiecie.',assetId:'photo',altText:'Parkiet i klubowa historia.'}));
 project.content.tableRows=Array.from({length:3},(_,i)=>({label:['PUNKTY','ZBIÓRKI','ASYSTY'][i],value:['108','42','24'][i],detail:''}));
 if(type.family==='statistics') project.content.body='';
 project.content.partnerIds=type.variant==='spotlight'?['1']:['1','2','3','4'];
 return project;
}
if(process.argv[1]?.endsWith('catalog-fixtures.js')) console.log(JSON.stringify(postTypes.map(type=>({...type,projects:type.styles.map(style=>fixture(type,style))}))));
