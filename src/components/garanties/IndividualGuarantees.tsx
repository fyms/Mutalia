'use client';
import { useState } from 'react';
import { individualCatalog2026 as catalog } from '@/lib/data/harmonie/individualCatalog';
import { simulateIndividual, hasDeterminedApplication, CONDITION_TO_VERIFY } from '@/lib/domain/individualSimulation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, DataToVerifyBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';
const field='m-field mt-1';
export function IndividualGuarantees({ simulator = false }: { simulator?: boolean }) {
  const products=catalog.listProducts();
  const [reference,setReference]=useState(products[0].reference);
  return <div className="space-y-4"><label className="m-filterbar block text-sm">Famille · Régime · Référence/Formule<select className={field} value={reference} onChange={e=>setReference(e.target.value)}>{products.map(p=><option key={p.reference} value={p.reference}>{p.family} · {p.regime} · {p.reference}</option>)}</select></label><Product key={reference} reference={reference} simulator={simulator}/></div>;
}
function Product({ reference, simulator }: {reference:string;simulator:boolean}) {
  const rows=catalog.listForConsultation(reference);
  const calculable=catalog.listCalculableGuarantees(reference);
  const [id,setId]=useState('');
  const [result,setResult]=useState<ReturnType<typeof simulateIndividual>|null>(null);
  const [error,setError]=useState('');
  const selected=catalog.getCalculableGuarantee(reference,id);
  const applicationBlocked=!!selected&&!hasDeterminedApplication(selected);
  return <>
    {simulator&&<Card><CardHeader title="Simulation particuliers 2026" subtitle="Une unité de soin : un œil, un implant, une nuit ou un jour ; forfait annuel selon la garantie."/>
      <form className="space-y-3" onChange={()=>{setResult(null);setError('');}} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{setResult(simulateIndividual(reference,id,Number(f.get('billed')),f.get('consumed') === null || String(f.get('consumed')).trim() === '' ? undefined : Number(f.get('consumed')),f.get('eligible')==='on'));}catch(e){setError(e instanceof Error?e.message:'Calcul indisponible');}}}>
        <label className="block text-sm">Prestation garantie<select required className={field} value={id} onChange={e=>setId(e.target.value)}><option value="">Choisir une prestation vérifiée</option>{calculable.map(g=><option key={g.id} value={g.id}>{g.category} — {g.benefit} — {g.value} {g.unit}</option>)}</select></label>
        {!calculable.length&&<DataToVerifyBadge/>}
        {applicationBlocked&&<div role="status" className="m-notice"><Badge tone="success">Vérifié</Badge> <DataToVerifyBadge label={CONDITION_TO_VERIFY}/><p className="text-sm mt-2">Garantie documentée, calcul indisponible tant que ses conditions ne sont pas déterminées.</p></div>}
        {selected&&<><p className="text-sm">{selected.condition} {selected.limit}</p><p className="text-xs">{selected.sourceFile} — page {selected.sourcePage}</p></>}
        <label className="block text-sm">Montant facturé pour cette unité (€)<input name="billed" disabled={applicationBlocked} required type="number" min="0" step="0.01" className={field}/></label>
        {selected?.unit==='EUR/an'&&<label className="block text-sm">Forfait déjà consommé cette année (€)<input name="consumed" disabled={applicationBlocked} required type="number" min="0" step="0.01" className={field}/></label>}
        <label className="flex gap-2 text-sm"><input key={id} name="eligible" type="checkbox" required disabled={applicationBlocked}/>Droits, conditions et limites contrôlés, y compris nombre d’implants/nuits et accord tarifaire ; aucun remboursement AMO pour ce poste.</label>
        <button disabled={!selected||applicationBlocked} className="m-button">Calculer</button>
        {error&&<p className="m-error" role="alert">{error}</p>}{result&&<p role="status">AMC : {formatCurrency(result.amcReimbursement)} · RAC : {formatCurrency(result.remainingCharge)}</p>}
      </form></Card>}
    <Card><CardHeader title={`Garanties particuliers — ${reference}`} subtitle="Les candidats sont consultables uniquement ; leurs valeurs ne sont pas proposées au calcul."/>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th>Catégorie / prestation</th><th>Valeur / mode</th><th>Statut</th><th>Provenance</th></tr></thead><tbody>{rows.map(g=><tr key={g.id} className="border-t border-border"><td className="p-2">{g.category}<br/>{g.benefit}</td><td className="p-2">{g.status==='verified'?<>{g.value} {g.unit} · Forfait<br/>{g.limit}<br/>{g.condition}</>:'Donnée 2026 à vérifier'}</td><td>{g.status==='verified'?<div className="space-y-1"><Badge tone="success">Vérifié</Badge>{!hasDeterminedApplication(g)&&<DataToVerifyBadge label={CONDITION_TO_VERIFY}/>}</div>:<DataToVerifyBadge/>}</td><td className="p-2">{g.sourceFile}<br/>Page {g.sourcePage}</td></tr>)}</tbody></table></div>
    </Card>
  </>;
}
