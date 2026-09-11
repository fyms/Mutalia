import { z } from "zod";
export const APPOINTMENT_TYPES=["Téléphone","Visio","Présentiel","Autre"] as const;
export const APPOINTMENT_STATUSES=["Planifié","Confirmé","Réalisé","Annulé","Absent"] as const;
export const DURATIONS=[15,30,45,60,90] as const;
export const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
export function endTime(start:string,duration:number){const end=minutes(start)+duration;return `${String(Math.floor(end/60)).padStart(2,"0")}:${String(end%60).padStart(2,"0")}`;}
export const AppointmentInputSchema=z.object({
 householdId:z.string().min(1),date:z.iso.date(),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,"Heure requise au format HH:mm."),
 durationMinutes:z.number().refine(n=>DURATIONS.includes(n as typeof DURATIONS[number]),"Durée invalide."),
 type:z.enum(APPOINTMENT_TYPES),reason:z.string().trim().min(3).max(200),status:z.enum(APPOINTMENT_STATUSES),notes:z.string().trim().max(3000).default(""),
}).refine(p=>minutes(p.startTime)+p.durationMinutes<1440,{message:"Le rendez-vous doit se terminer avant minuit.",path:["durationMinutes"]});
export type AppointmentInput=z.infer<typeof AppointmentInputSchema>;
export interface Appointment extends AppointmentInput {id:string;adherentName:string;createdAt:string;updatedAt:string;revision:number;contactId?:string;}
export const activeAppointment=(p:Pick<Appointment,"status">)=>p.status==="Planifié"||p.status==="Confirmé";
export function overlaps(a:AppointmentInput,b:AppointmentInput){return a.date===b.date&&activeAppointment(a)&&activeAppointment(b)&&minutes(a.startTime)<minutes(b.startTime)+b.durationMinutes&&minutes(b.startTime)<minutes(a.startTime)+a.durationMinutes;}
export function sortAppointments(rows:Appointment[]){return [...rows].sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)||a.id.localeCompare(b.id));}
export function localToday(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
export function upcomingAppointments(rows:Appointment[],now=new Date()) {
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const time=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
 return sortAppointments(rows.filter(p=>activeAppointment(p)&&(p.date>today||(p.date===today&&endTime(p.startTime,p.durationMinutes)>time))));
}
export function agendaDates(anchor:string,view:"today"|"week"|"month") {
 const date=new Date(`${anchor}T12:00:00Z`);if(view==="week")date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);if(view==="month")date.setUTCDate(1);
 const count=view==="today"?1:view==="week"?7:new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
 return Array.from({length:count},(_,i)=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
}
/** Stable non-overlapping columns for a day's visual time slots. */
export function appointmentSlots(rows:Appointment[]) {
 const ends:number[]=[];
 const slots=sortAppointments(rows).map(appointment=>{let lane=ends.findIndex(end=>end<=minutes(appointment.startTime));if(lane<0)lane=ends.length;ends[lane]=minutes(appointment.startTime)+appointment.durationMinutes;return {appointment,lane};});
 return slots.map(slot=>({...slot,lanes:ends.length}));
}
