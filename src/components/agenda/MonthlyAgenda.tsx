"use client";
import { useState, type ReactNode } from "react";
import { BusinessStatus } from "@/components/ui/StatusPill";
import { agendaDates, endTime, localToday, sortAppointments, type Appointment } from "@/lib/domain/appointments";
import styles from "./MonthlyAgenda.module.css";

const weekdays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) => new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { ...options, timeZone: "UTC" });
export function MonthlyAgenda({ date, rows, onDateChange, onEdit, renderDetail }: {
 date: string; rows: Appointment[]; onDateChange: (date: string) => void;
 onEdit: (appointment: Appointment) => void; renderDetail: (appointment: Appointment) => ReactNode;
}) {
 const [selectedDay, setSelectedDay] = useState<string>();
 const dates = agendaDates(date, "month");
 const offset = (new Date(`${dates[0]}T12:00:00Z`).getUTCDay() + 6) % 7;
 const cells = [...Array<string | null>(offset).fill(null), ...dates];
 while (cells.length % 7) cells.push(null);
 const today = localToday();
 const appointments = sortAppointments(rows);
 function moveMonth(delta: number) {
  const next = new Date(`${dates[0]}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + delta);
  onDateChange(next.toISOString().slice(0, 10));
  setSelectedDay(undefined);
 }
 return <section className={styles.calendar} aria-label="Agenda mensuel">
  <header className={styles.header}><h2>{formatDate(date, { month: "long", year: "numeric" })}</h2><div className={styles.navigation}>
   <button className="m-button m-button--secondary" aria-label="Mois précédent" onClick={() => moveMonth(-1)}>←</button>
   <button className="m-button m-button--secondary" onClick={() => { onDateChange(today); setSelectedDay(undefined); }}>Ce mois-ci</button>
   <button className="m-button m-button--secondary" aria-label="Mois suivant" onClick={() => moveMonth(1)}>→</button>
  </div></header>
  <div className={styles.grid}>
   {weekdays.map(day => <div className={styles.weekday} key={day}>{day}</div>)}
   {cells.map((day, index) => {
    if (!day) return <div className={styles.padding} aria-hidden="true" key={`padding-${index}`} />;
    const items = appointments.filter(item => item.date === day);
    return <section className={`${styles.day} ${day === today ? styles.today : ""}`} key={day} aria-label={formatDate(day, { dateStyle: "full" })}>
     <h3 className={styles.dayHeading}><time dateTime={day} aria-current={day === today ? "date" : undefined}><span className={styles.mobileWeekday}>{formatDate(day, { weekday: "short" })} </span>{Number(day.slice(-2))}</time>{day === today && <span>Aujourd’hui</span>}</h3>
     {items.slice(0, 2).map(item => <button key={item.id} className={styles.appointment} onClick={() => onEdit(item)} title={`${item.adherentName} · ${item.reason} · ${item.status}`}>
      <span className={styles.time}>{item.startTime}–{endTime(item.startTime, item.durationMinutes)}</span>
      <strong className={styles.name}>{item.adherentName}</strong><span className={styles.reason}>{item.reason}</span>
      <span className={styles.badges}><BusinessStatus status={item.contactType === "prospect" ? "PROSPECT" : "ADHÉRENT"} /><BusinessStatus status={item.status} /></span>
     </button>)}
     {!items.length && <p className={styles.empty}>Aucun rendez-vous</p>}
     {!!items.length && <a className={styles.more} href="#monthly-day-details" onClick={() => setSelectedDay(day)}>{items.length > 2 ? `+ ${items.length - 2} autres` : "Détails et actions"}<span className="sr-only"> du {formatDate(day, { dateStyle: "long" })}</span></a>}
    </section>;
   })}
  </div>
  {selectedDay && dates.includes(selectedDay) && <section id="monthly-day-details" className="m-panel" aria-label="Détail de la journée"><h2>{formatDate(selectedDay, { dateStyle: "full" })}</h2>{appointments.filter(item => item.date === selectedDay).map(item => <article className={styles.detail} key={item.id}>{renderDetail(item)}</article>)}</section>}
 </section>;
}
