import { BANKING_NOTICE,maskDemoIban,PAYMENT_METHOD_LABELS,PAYMENT_METHODS,paymentFrequency,mandateStatusLabel,type DemoBanking } from "@/lib/domain/demoBanking";
import { formatDate } from "@/lib/utils/format";
export function BankingSummary({banking,details=false}:{banking?:DemoBanking;details?:boolean}) {
 const payment=banking?.paymentAccount;
 return <section className="m-panel" aria-label="Coordonnées bancaires"><h2 className="font-semibold">Coordonnées bancaires</h2><p className="m-help">{BANKING_NOTICE}</p>{banking&&payment?<dl className="grid gap-2 text-sm sm:grid-cols-2 mt-2">
 <div><dt>Compte de règlement</dt><dd>{payment.accountHolder} · {maskDemoIban(payment.iban)}</dd></div>
 <div><dt>Compte de remboursement</dt><dd>{banking.refundAccount.sameAsPayment?"Même compte · ":""}{maskDemoIban(banking.refundAccount.iban)}</dd></div>
 <div><dt>Mode de règlement</dt><dd>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</dd></div><div><dt>Périodicité</dt><dd>{paymentFrequency(payment.paymentFrequency)}</dd></div>
 {details&&payment.paymentMethod===PAYMENT_METHODS[0]&&<>
 <div><dt>Jour de prélèvement</dt><dd>{payment.debitDay??"Non renseigné"}<p className="m-help">Valeurs pédagogiques — selon règles de l’organisme</p></dd></div>
 <div><dt>Mandat</dt><dd>{mandateStatusLabel(payment.mandateStatus)}{payment.mandateDate&&` · signé le ${formatDate(payment.mandateDate)}`}</dd></div>
 <div><dt>RUM démo</dt><dd>{payment.mandateReference??"Non renseignée"}<p className="m-help">Mandat fictif — environnement pédagogique</p></dd></div>
 </>}</dl>:<p className="m-help">Non renseignées · Périodicité par défaut : Mensuelle.</p>}</section>;
}
