/** Tracé vectoriel extrait de la charte Mutalia V3, page 2 (grille 48 × 48). */
export function MutaliaMark({size=32,color="#215D91"}:{size?:24|32;color?:string}) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
    <path d="M8 38V10H16L24 20L32 10H40V38H32V23L24 33L16 23V38Z" fill={color}/>
  </svg>;
}
