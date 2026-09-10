"use client";
import { useState } from "react";
import { CONVENTIONS, type Convention } from "@/lib/data/harmonie/conventions";
import { simulateConvention } from "@/lib/domain/conventionSimulation";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
const field = "mt-1 block w-full min-h-11 rounded border border-border bg-surface px-3 py-2 text-sm";
export function ConventionSimulator() {
  const [idcc,setIdcc] = useState("405");
  const convention = CONVENTIONS.find(c=>c.idcc===idcc)!;
  return <div className="space-y-4">
    <label className="block text-sm font-medium">Convention collective
      <select className={field} value={idcc} onChange={e=>setIdcc(e.target.value)}>{CONVENTIONS.map(c=><option key={c.idcc} value={c.idcc}>IDCC {c.idcc} — {c.label}</option>)}</select>
    </label>
    <ConventionWork key={idcc} convention={convention}/>
  </div>;
}
function ConventionWork({convention:c}:{convention:Convention}) {
  const [result,setResult] = useState<ReturnType<typeof simulateConvention>|null>(null);
  const [error,setError] = useState("");
  return <>
    <Card>
      <CardHeader title={`IDCC ${c.idcc} — ${c.year}`} subtitle="Hospitalisation : garanties exprimées en % de la base de remboursement, AMO incluse"/>
      <p className="mb-3 text-sm">{c.conditions}</p>
      <a className="text-brand underline" href={`/api/sources/harmonie/${c.idcc}#page=1`} target="_blank" rel="noreferrer">Consulter le PDF source — {c.file}, page 1{c.idcc==="2691"?" ; notes page 3":""}</a>
      <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Tableau des garanties hospitalisation">
        <table className="w-full text-left text-sm"><caption className="sr-only">Garanties IDCC {c.idcc}, édition du 1er janvier 2026</caption><thead><tr><th scope="col" className="p-2">Prestation</th>{c.levels.map(l=><th className="p-2 whitespace-nowrap" scope="col" key={l}>{l}</th>)}</tr></thead><tbody>{c.benefits.map(b=><tr className="border-t border-border" key={b.id}><th scope="row" className="p-2 font-normal">{b.label}</th>{b.rates.map((r,i)=><td key={i} className="p-2 whitespace-nowrap">{r} % BR</td>)}</tr>)}</tbody></table>
      </div>
      <p className="mt-3 text-xs text-foreground-muted">Périmètre partiel : chambres, forfaits, optique, dentaire, cotisations et plafonds ne sont pas intégrés à ce calcul. Aucune équivalence PSI/PLI.</p>
    </Card>
    <Card><CardHeader title="Simulation du poste hospitalisation" subtitle="Exercice fictif ; saisir les montants du dossier. Tous les champs sont obligatoires."/>
      <form className="space-y-4" onChange={()=>{setResult(null);setError("")}} onSubmit={e=>{
        e.preventDefault();const f=new FormData(e.currentTarget);
        try {setResult(simulateConvention({idcc:c.idcc,year:c.year,level:String(f.get("level")),benefit:String(f.get("benefit")),billed:Number(f.get("billed")),brss:Number(f.get("brss")),amo:Number(f.get("amo")),eligible:f.get("eligible")==="on"}));setError("")}
        catch(err){setResult(null);setError(err instanceof Error?err.message:"Calcul indisponible.")}
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Niveau contractuel<select name="level" className={field} required defaultValue=""><option value="" disabled>Choisir un niveau</option>{c.levels.map(l=><option key={l}>{l}</option>)}</select></label>
          <label className="text-sm">Prestation hospitalière<select name="benefit" className={field} required defaultValue=""><option value="" disabled>Choisir une prestation</option>{c.benefits.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></label>
          {[["billed","Montant facturé (€)"],["brss","Base de remboursement (€)"],["amo","Montant AMO retenu avant franchises (€)"]].map(([name,label])=><label className="text-sm" key={name}>{label}<input name={name} type="number" inputMode="decimal" step="0.01" min={name==="brss"?"0.01":"0"} required className={field}/></label>)}
        </div>
        <p className="text-xs text-foreground-muted">Simulation hors franchises et participations non remboursables : elles ne doivent pas être transférées à la complémentaire. Les droits ouverts, le conventionnement et le DPTM se contrôlent dans le dossier fictif.</p>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input name="eligible" type="checkbox" required className="h-5 w-5"/>J’ai vérifié les droits et les conditions du poste dans le PDF.</label>
        <button className="min-h-11 rounded bg-brand px-4 py-2 text-white" type="submit">Calculer ce poste</button>
        {error&&<p role="alert" className="text-danger">{error}</p>}
        {result&&<div role="status" className="rounded border border-border bg-surface-muted p-4"><p className="font-semibold">Résultat — IDCC {c.idcc} · {c.year}</p><p>Garantie totale : {result.rate} % BR, AMO incluse{c.idcc==="405"?", Base incluse dans les options":""}.</p><p>Plafond calculé AMO + AMC : {formatCurrency(result.totalCeiling)}</p><p>Part complémentaire totale : <strong>{formatCurrency(result.amc)}</strong></p><p>Reste à charge hors franchises : <strong>{formatCurrency(result.rac)}</strong></p></div>}
      </form>
    </Card>
  </>;
}
