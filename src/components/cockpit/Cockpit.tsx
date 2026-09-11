import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { sortDossiers,dossierAge,type Dossier } from "@/lib/domain/dossiers";
import { filterOperationalAnomalies,type OperationalAnomaly } from "@/lib/domain/operationalAnomalies";
import type { Prestation } from "@/lib/domain/prestations";
import type { DevisPec } from "@/lib/domain/devisPec";
import type { Complaint,Contact } from "@/lib/domain/relationAdherent";
import { cotisationSummary,type Cotisation } from "@/lib/domain/cotisations";
import { upcomingAppointments,endTime,type Appointment } from "@/lib/domain/appointments";
import { formatDate,formatDateTime,formatCurrency } from "@/lib/utils/format";
export interface CockpitData {dossiers:Dossier[];anomalies:OperationalAnomaly[];appointments:Appointment[];prestations:Prestation[];complaints:Complaint[];quotes:DevisPec[];cotisations:Cotisation[];contacts:Contact[];}
const recent=<T extends {id:string;updatedAt:string}>(rows:T[])=>[...rows].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
export function Cockpit({data,now=new Date()}:{data:CockpitData;now?:Date}) {
 const open=sortDossiers(data.dossiers.filter(d=>d.status!=="Terminé"));
 const urgent=open.filter(d=>d.priority==="Urgent");
 const anomalies=filterOperationalAnomalies(data.anomalies.filter(a=>a.status!=="Résolue"),{});
 const pending=data.prestations.filter(p=>!["Payée","Clôturée"].includes(p.status)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 const complaints=data.complaints.filter(c=>!["Résolue","Clôturée"].includes(c.status)).sort((a,b)=>["Urgent","Normal","Faible"].indexOf(a.priority)-["Urgent","Normal","Faible"].indexOf(b.priority)||a.receivedDate.localeCompare(b.receivedDate));
 const appointments=upcomingAppointments(data.appointments,now).slice(0,4);
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const dues=data.cotisations.map(p=>({p,summary:cotisationSummary(p,today)})).filter(({summary})=>summary.overdue||summary.status==="Partielle").sort((a,b)=>Number(b.summary.overdue)-Number(a.summary.overdue)||a.p.dueDate.localeCompare(b.p.dueDate));
 const activity=[
 ...data.prestations.map(p=>({id:`p-${p.id}`,at:p.updatedAt,title:`Prestation · ${p.act}`,name:p.adherentName,status:p.status,href:`/prestations#${p.id}`})),
 ...data.quotes.map(p=>({id:`q-${p.id}`,at:p.updatedAt,title:`${p.kind==="pec"?"PEC":"Devis"} · ${p.act}`,name:p.adherentName,status:p.status,href:`/pec-devis#${p.id}`})),
 ...data.complaints.map(p=>({id:`r-${p.id}`,at:p.updatedAt,title:`Réclamation · ${p.reason}`,name:p.adherentName,status:p.status,href:`/relation-adherent#${p.id}`})),
 ...data.contacts.map(p=>({id:`c-${p.id}`,at:p.createdAt,title:`Contact · ${p.reason}`,name:p.adherentName,status:p.channel,href:`/adherents/${p.householdId}?tab=contacts`})),
 ...data.appointments.map(p=>({id:`a-${p.id}`,at:p.updatedAt,title:`Rendez-vous · ${p.reason}`,name:p.adherentName,status:p.status,href:"/agenda"})),
 ...data.cotisations.map(p=>({id:`cot-${p.id}`,at:p.updatedAt,title:`Cotisation · ${p.period}`,name:p.adherentName,status:cotisationSummary(p,today).status,href:`/cotisations#${p.id}`})),
 ...data.anomalies.map(p=>({id:`an-${p.id}`,at:p.updatedAt,title:`Anomalie · ${p.type}`,name:p.adherentName,status:p.status,href:`/flux-anomalies#${p.id}`})),
 ].sort((a,b)=>b.at.localeCompare(a.at)||a.id.localeCompare(b.id)).slice(0,6);
 return <div className="space-y-4">
 <PageHeader title="Cockpit de gestion" description="Votre journée · priorités, rendez-vous et suivi des traitements" action={<Link className="m-button m-button--secondary" href="/adherents">Rechercher un adhérent</Link>}/>
 <nav aria-label="Indicateurs de traitement" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
 {label:"Dossiers urgents",count:urgent.length,href:"/dossiers?priority=Urgent",detail:"non terminés"},
 {label:"Anomalies ouvertes",count:anomalies.length,href:"/flux-anomalies",detail:"à analyser ou en cours"},
 {label:"Prestations en attente",count:pending.length,href:"/prestations",detail:"avant paiement / clôture"},
 {label:"Réclamations ouvertes",count:complaints.length,href:"/relation-adherent",detail:"non résolues"},
 ].map(k=><Link key={k.label} href={k.href} className="m-panel block hover:bg-surface-muted"><p className="text-sm font-medium">{k.label}</p><strong className="text-3xl text-brand">{k.count}</strong><p className="text-xs text-foreground-muted">{k.detail} →</p></Link>)}</nav>
 <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
 <div className="space-y-4 min-w-0"><Panel title="À traiter en priorité" href="/dossiers" action="Tous les dossiers" count={open.length}>
 <p className="text-xs text-foreground-muted mb-2">Urgence puis ancienneté · aucune échéance de dossier renseignée.</p>
 {open.slice(0,5).map(d=><article key={d.id} className="border-b border-border py-2 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><Member id={d.householdId} name={d.adherent}/><div className="flex gap-1"><Badge tone={d.priority==="Urgent"?"danger":"neutral"}>{d.priority}</Badge><Badge tone={d.status==="Incomplet"?"warning":"brand"}>{d.status}</Badge></div></div><p className="text-sm mt-1">{d.type} · {dossierAge(d.createdAt,now.getTime())} j</p>{d.anomaly&&<p className="text-xs text-foreground-muted">{d.anomaly}</p>}<Link className="inline-block text-sm text-brand underline py-1" href={`/dossiers#${d.id}`}>{d.nextAction} →</Link></article>)}{!open.length&&<Empty>Aucun dossier en attente de traitement.</Empty>}
 </Panel>
<Panel title="Traitements à poursuivre" href="/prestations" action="Prestations">
 <h3 className="font-semibold text-sm">Prestations en attente</h3>{pending.slice(0,3).map(p=><Item key={p.id} href={`/prestations#${p.id}`} name={p.adherentName} title={p.act} status={p.status}/>)}{!pending.length&&<Empty>Aucune prestation en attente.</Empty>}
 <h3 className="font-semibold text-sm mt-3"><Link className="underline" href="/relation-adherent">Réclamations ouvertes</Link></h3>{complaints.slice(0,3).map(p=><Item key={p.id} href={`/relation-adherent#${p.id}`} name={p.adherentName} title={p.reason} status={p.status}/>)}{!complaints.length&&<Empty>Aucune réclamation ouverte.</Empty>}
 </Panel>
{data.cotisations.length>0&&<Panel title="Cotisations à surveiller" href="/cotisations" action="Cotisations" count={dues.length}>{dues.slice(0,3).map(({p,summary})=><Item key={p.id} href={`/cotisations#${p.id}`} name={p.adherentName} title={`${p.period} · solde ${formatCurrency(summary.balance/100)} · échéance ${formatDate(p.dueDate)}`} status={summary.overdue?`${summary.status} · En retard`:summary.status}/>)}{!dues.length&&<Empty>Aucun impayé ni règlement partiel à surveiller.</Empty>}</Panel>}</div>
 <div className="space-y-4 min-w-0">
 <Panel title="Mes prochains rendez-vous" href="/agenda" action="Ouvrir l’agenda">
 {appointments.map(p=><article key={p.id} className="border-b border-border py-2 last:border-0"><div className="flex flex-wrap gap-2 items-center"><strong className="text-sm">{p.date===today?"Aujourd’hui":formatDate(p.date)} · {p.startTime}–{endTime(p.startTime,p.durationMinutes)}</strong><Badge tone="brand">{p.status}</Badge></div>{p.contactType==="prospect"?<><Badge tone="brand">Prospect</Badge> <Link className="text-brand underline" href={`/prospects#${p.prospectId}`}>{p.adherentName}</Link></>:<Member id={p.householdId} name={p.adherentName}/>}<p className="text-sm">{p.type} · {p.reason}</p></article>)}{!appointments.length&&<Empty>Aucun rendez-vous à venir. <Link className="underline text-brand" href="/agenda">Planifier un rendez-vous</Link></Empty>}
 </Panel>
 <Panel title="Alertes / anomalies" href="/flux-anomalies" action="Toutes les anomalies" count={anomalies.length}>
 {anomalies.slice(0,3).map(a=><article key={a.id} className="border-b border-border py-2 last:border-0"><div className="flex flex-wrap gap-1"><Badge tone={a.severity==="Bloquante"?"danger":"warning"}>{a.severity}</Badge><Badge>{a.status}</Badge></div><Member id={a.householdId} name={a.adherentName}/><p className="text-sm">{a.cause}</p><Link className="text-sm underline text-brand" href={`/flux-anomalies#${a.id}`}>{a.recommendation} →</Link></article>)}{!anomalies.length&&<Empty>Aucune anomalie ouverte.</Empty>}
 </Panel>
<Panel title="Activité récente" href="/relation-adherent" action="Relation adhérent">
 <p className="text-xs text-foreground-muted">Dernières mises à jour enregistrées</p><ol>{activity.map(p=><li key={p.id}><Item href={p.href} name={p.name} title={p.title} status={p.status}/><p className="text-xs text-foreground-muted pb-2">{formatDateTime(p.at)}</p></li>)}</ol>{!activity.length&&<Empty>Aucune activité enregistrée.</Empty>}
 </Panel>
<Panel title="PEC / devis récents" href="/pec-devis" action="PEC / Devis">{recent(data.quotes).slice(0,3).map(p=><Item key={p.id} href={`/pec-devis#${p.id}`} name={p.adherentName} title={`${p.kind==="pec"?"PEC":"Devis"} · ${p.act}`} status={p.status}/>)}{!data.quotes.length&&<Empty>Aucun devis ou PEC enregistré.</Empty>}</Panel></div></div>

 </div>;
}
function Panel({title,href,action,count,children}:{title:string;href:string;action:string;count?:number;children:ReactNode}){return <Card className="min-w-0"><section aria-label={title}><header className="flex flex-wrap items-center justify-between gap-2 mb-2"><h2 className="font-semibold">{title}{count!==undefined&&<span className="text-sm text-foreground-muted"> · {count}</span>}</h2><Link className="text-xs text-brand underline py-2" href={href}>{action} →</Link></header>{children}</section></Card>;}
function Member({id,name}:{id:string;name:string}){return <Link className="inline-block text-sm font-medium text-brand underline py-1" href={`/adherents/${id}`}>{name}</Link>;}
function Empty({children}:{children:ReactNode}){return <p className="text-sm text-foreground-muted py-2">{children}</p>;}
function Item({href,name,title,status}:{href:string;name:string;title:string;status:string}){return <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border py-2 last:border-0"><Link href={href} className="min-w-0 flex-1 text-sm text-brand underline"><span className="font-medium">{name}</span><br/>{title}</Link><Badge>{status}</Badge></div>;}
