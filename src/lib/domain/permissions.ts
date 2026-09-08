import type { Role } from "@/lib/domain/constants";

export function canViewAnswerKeys(role: Role): boolean {
  return role === "formateur";
}

export class ForbiddenError extends Error {}

export function assertFormateur(role: Role): void {
  if (role !== "formateur") {
    throw new ForbiddenError(
      "Le corrigé n'est jamais transmis en mode apprenant : basculez en mode formateur pour y accéder.",
    );
  }
}
