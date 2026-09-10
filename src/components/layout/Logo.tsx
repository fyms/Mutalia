import Link from "next/link";
export function Logo() {
  return (
    <Link href="/cockpit" aria-label="Mutalia, cockpit" className="m-logo">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 38V10H16L24 20L32 10H40V38H32V23L24 33L16 23V38Z"
        />
      </svg>
      <span>Mutalia</span>
    </Link>
  );
}
