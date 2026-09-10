import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";
export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`m-button ${className}`} />;
}
export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="m-label">{label}</span>
      <input {...props} className="m-field" />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="m-label">{label}</span>
      <select {...props} aria-label={label} className="m-field">
        {children}
      </select>
    </label>
  );
}
export function ContextHelp() {
  return (
    <details className="m-panel">
      <summary>Voir une aide de méthode</summary>
      <p>
        Comparez le bénéficiaire, les dates et les montants entre les pièces.
        Identifiez les données manquantes et consultez la source 2026 avant tout
        calcul.
      </p>
    </details>
  );
}
