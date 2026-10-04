// Existing assets keep their approvals and provenance. This restricts combinations only.
const bundled = {
 '01-ciemna-farba.png':{surface:'dark',kits:['A']},
 '02-jasny-papier.png':{surface:'paper',kits:['A']},
 '03-czerwono-czarna-faktura.png':{surface:'dark',kits:['A']},
 '04-ciemny-parkiet.png':{surface:'dark',kits:['A']},
 '05-papier-bawelniany.png':{surface:'paper',kits:['A']},
 '06-czerwone-swiatlo.png':{surface:'dark',kits:['A']},
 '07-hala-pelne-boisko.png':{surface:'dark',kits:['A']},
 '08-boisko-z-gory.png':{surface:'dark',kits:['A']},
 '09-luk-za-trzy.png':{surface:'dark',kits:['A']},
};
export function materialUsage(asset) {
 const file=asset?.provenance?.importBatch?.split(':').at(-1);
 return bundled[file] || null;
}
export function materialCompatible(project,asset) {
 const usage=materialUsage(asset);if(!usage)return true; // Other assets require explicit composition/material review.
 const paper=['lineup','report','partners','schedule','statistics','club'].includes(project.family) && project.visualStyle!=='photo';
 return usage.surface===(paper?'paper':'dark') && usage.kits.includes(project.content.kit);
}
