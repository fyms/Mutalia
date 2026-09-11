import Link from 'next/link';
export function Logo() {
  return <Link href="/cockpit" aria-label="Mutalia, cockpit" className="m-logo"><b className="m-monogram" aria-hidden="true">M</b><span className="m-logo-copy">Mutalia<small>Gestion Santé &amp; Prévoyance</small></span></Link>;
}
