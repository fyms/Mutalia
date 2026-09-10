"use client";
import { useState, useTransition } from "react";
import {
  inviteAccount,
  changeAccount,
  assignLearner,
} from "@/lib/auth/adminActions";
import { ROLE_LABELS, type Role } from "@/lib/domain/constants";
export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  banned: boolean;
  active: boolean;
}
export function Accounts({
  users,
  assignments,
}: {
  users: AccountRow[];
  assignments: { trainer: string; learner: string }[];
}) {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function run(fn: () => Promise<string>) {
    start(async () => {
      try {
        setMessage(await fn());
      } catch {
        setMessage(
          "Action impossible. Vérifiez les champs, les droits ou la configuration du transport ; réessayez.",
        );
      }
    });
  }
  return (
    <div className="space-y-6">
      <section className="m-panel">
        <h2>Inviter un utilisateur</h2>
        <form
          className="m-filters"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(() => inviteAccount(Object.fromEntries(f)));
          }}
        >
          <label>
            <span className="m-label">Nom d’affichage</span>
            <input className="m-field" name="name" required />
          </label>
          <label>
            <span className="m-label">Adresse e-mail</span>
            <input className="m-field" name="email" type="email" required />
          </label>
          <label>
            <span className="m-label">Rôle</span>
            <select aria-label="Rôle" className="m-field" name="role">
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button className="m-button" disabled={pending}>
            Créer l’invitation
          </button>
        </form>
      </section>
      <p role="status">{message}</p>
      <section className="m-panel">
        <h2>Comptes</h2>
        {users.map((u) => (
          <form
            key={u.id}
            className="m-filters border-b border-border pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                changeAccount({
                  id: u.id,
                  role: f.get("role"),
                  disabled: f.get("disabled") === "on",
                }),
              );
            }}
          >
            <div>
              <strong>{u.name}</strong>
              <p>{u.email}</p>
              <p>{u.active ? "Activé" : "Invitation à activer"}</p>
            </div>
            <label>
              <span className="m-label">Rôle de {u.name}</span>
              <select
                aria-label={`Rôle de ${u.name}`}
                className="m-field"
                name="role"
                defaultValue={u.role}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                name="disabled"
                defaultChecked={u.banned}
              />
              Désactiver
            </label>
            <button className="m-button m-button--secondary" disabled={pending}>
              Mettre à jour
            </button>
          </form>
        ))}
      </section>
      <section className="m-panel">
        <h2>Rattachements formateur</h2>
        <form
          className="m-filters"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(() =>
              assignLearner({
                trainer: f.get("trainer"),
                learner: f.get("learner"),
                remove: f.get("remove") === "on",
              }),
            );
          }}
        >
          <label>
            <span className="m-label">Formateur</span>
            <select className="m-field" name="trainer" required>
              <option value="">Sélectionner</option>
              {users
                .filter((u) => u.role === "formateur")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="m-label">Apprenant</span>
            <select className="m-field" name="learner" required>
              <option value="">Sélectionner</option>
              {users
                .filter((u) => u.role === "apprenant")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex gap-2">
            <input type="checkbox" name="remove" />
            Retirer le rattachement
          </label>
          <button className="m-button" disabled={pending}>
            Enregistrer
          </button>
        </form>
        <ul>
          {assignments.map((a) => (
            <li key={a.trainer + a.learner}>
              {users.find((u) => u.id === a.trainer)?.name} →{" "}
              {users.find((u) => u.id === a.learner)?.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
