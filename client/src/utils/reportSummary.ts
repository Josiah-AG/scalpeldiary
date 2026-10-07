export function summarizeReport(logs: any[], presentations: any[]) {
 const countBy=(rows: any[],key: string) => rows.reduce((acc,row) => {const k=row[key] || 'Unknown';acc[k]=(acc[k]||0)+1;return acc;},{} as Record<string,number>);
 const rows=(counts:Record<string,number>,key:string) => Object.entries(counts).map(([name,count])=>({[key]:name,count}));
 return {totalSurgeries:logs.length,verifiedSurgeries:logs.filter(x=>x.status==='RATED'||x.detachment_verified).length,
 totalPresentations:presentations.length,verifiedPresentations:presentations.filter(x=>x.status==='RATED'||x.detachment_verified).length,
 averageRating:null,seniorSupervisorRating:null,avgPresentationRating:null,
 roleDistribution:countBy(logs,'surgery_role'),procedureTypeDistribution:countBy(logs,'procedure_type'),
 topProcedures:rows(countBy(logs,'procedure'),'procedure').sort((a,b)=>b.count-a.count).slice(0,10),
 institutionProcedures:rows(countBy(logs,'place_of_practice'),'place_of_practice'),
 supervisorDistribution:rows(countBy(logs,'supervisor_name'),'supervisor_name')};
}
