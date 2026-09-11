import Link from "next/link";
import { getAppointments } from "@/lib/store/runtimeStore";
import { upcomingAppointments,endTime,localToday } from "@/lib/domain/appointments";
export function AppointmentSummary({owner,householdId,history=false}:{owner:string;householdId?:string;history?:boolean}){
 const all=getAppointments(owner).filter(p=>!householdId||p.householdId===householdId);
 const upcoming=upcomingAppointments(all);const rows=history?all.filter(p=>!upcoming.some(u=>u.id===p.id)&&p.date<=localToday()).reverse():upcoming.slice(0,householdId?20:6);
 return <section className="m-panel mb-4" aria-label={history?"Historique des rendez-vous":householdId?"Prochains rendez-vous":"Mes prochains rendez-vous"}><h2>{history?"Historique des rendez-vous":householdId?"Prochains rendez-vous":"Mes prochains rendez-vous"}</h2>
 {householdId&&!history&&<Link className="m-button m-button--secondary" href={`/agenda?householdId=${encodeURIComponent(householdId)}`}>Planifier un rendez-vous</Link>}
 <ul>{rows.map(p=><li key={p.id} className="py-2"><Link className="underline" href="/agenda">{p.date} · {p.startTime}–{endTime(p.startTime,p.durationMinutes)}</Link> · <Link className="text-brand underline" href={`/adherents/${p.householdId}`}>{p.adherentName}</Link> · {p.type} · {p.reason} · {p.status}</li>)}</ul>{!rows.length&&<p>Aucun rendez-vous {history?"passé":"à venir"}.</p>}</section>;
}
