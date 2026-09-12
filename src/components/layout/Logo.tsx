import Link from 'next/link';
import { MutaliaMark } from './MutaliaMark';
export function Logo() {
  return <Link href="/cockpit" aria-label="Mutalia, cockpit" className="m-logo"><MutaliaMark color="currentColor"/><span className="m-logo-copy">Mutalia</span></Link>;
}
