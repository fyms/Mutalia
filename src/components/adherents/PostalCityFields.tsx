"use client";
import { useEffect, useState } from "react";

type Commune = {nom: string; code: string};
export function PostalCityFields({postalCode = "", city = "", required = true}: {postalCode?: string; city?: string; required?:boolean}) {
  const [postal, setPostal] = useState(postalCode);
  const [selected, setSelected] = useState(city);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(/^[0-9]{5}$/.test(postalCode) ? "loading" : "idle");
  const [manual, setManual] = useState(false);
  const valid = /^[0-9]{5}$/.test(postal);
  useEffect(() => {
    if (!/^[0-9]{5}$/.test(postal)) return;
    const controller = new AbortController();
    let current = true;
    fetch(`/api/communes?codePostal=${postal}`, {signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error("Service indisponible");
        const rows: Commune[] = await response.json();
        if (!current) return;
        setCommunes(rows);
        setSelected(existing => existing || (rows.length === 1 ? rows[0].nom : ""));
        setStatus("ready");
      })
      .catch(() => {if (current) setStatus("error");});
    return () => {current = false; controller.abort();};
  }, [postal]);
  const savedCityOutsideList = selected && !communes.some(c => c.nom === selected);
  return <>
    <label className="block"><span className="m-label">Code postal</span>
      <input name="postalCode" className="m-field" value={postal} required={required} pattern="[0-9]{5}" maxLength={5} inputMode="numeric" onChange={e => {
        const next = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
        if (next === postal) return;
        setPostal(next); setSelected(""); setCommunes([]); setManual(false);
        setStatus(/^[0-9]{5}$/.test(next) ? "loading" : "idle");
      }}/>
    </label>
    <div><label className="block"><span className="m-label">Ville</span>
      {manual ? <input name="city" className="m-field" required={required} maxLength={100} value={selected} onChange={e => setSelected(e.target.value)}/> :
        <select name="city" className="m-field" required={required} value={selected} disabled={!valid || status === "loading"} onChange={e => setSelected(e.target.value)}>
          <option value="">{status === "loading" ? "Chargement des communes…" : "Choisir une commune"}</option>
          {savedCityOutsideList && <option value={selected}>{selected} (ville enregistrée)</option>}
          {communes.map(c => <option key={c.code} value={c.nom}>{c.nom}</option>)}
        </select>}
    </label>
    {status === "error" && <p role="status" className="m-help">Service des communes temporairement indisponible</p>}
    {status === "ready" && !communes.length && <p role="status" className="m-help">Aucune commune trouvée pour ce code postal.</p>}
    {valid && (status === "error" || (status === "ready" && !communes.length)) && !manual &&
      <button type="button" className="m-button m-button--secondary mt-2" onClick={() => setManual(true)}>Saisir la ville manuellement</button>}
    </div>
  </>;
}
