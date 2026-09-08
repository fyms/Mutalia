export function RealDocumentWarningBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-xs text-warning">
      <span className="text-base leading-none">⚠️</span>
      <div>
        <p className="font-semibold">Avant tout import d&apos;un document réel</p>
        <p className="mt-0.5">
          Mutalia est un environnement de formation. Utilisez par défaut les documents fictifs fournis
          (marqués « DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR »). Si vous importez malgré tout un
          document réel, anonymisez au préalable toute donnée personnelle, bancaire ou de santé qui n&apos;est
          pas strictement nécessaire à l&apos;exercice : aucun numéro de sécurité sociale ni IBAN valide ne
          doit être présent.
        </p>
      </div>
    </div>
  );
}

export function SyntheticDataFooter() {
  return (
    <p className="mt-6 text-center text-[11px] text-foreground-muted">
      Environnement pédagogique Mutalia — données et documents fictifs, aucune télétransmission réelle.
    </p>
  );
}
