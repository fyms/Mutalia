import { NextResponse } from "next/server";
import { getAllProfilesProgression } from "@/lib/domain/progression";
import { getSession } from "@/lib/store/session";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getSession();
  if (session.role !== "formateur") {
    return NextResponse.json({ error: "Réservé au mode Formateur." }, { status: 403 });
  }

  const rows: string[] = [
    ["profil", "type", "identifiant", "titre", "tentatives", "meilleur_score", "score_max", "derniere_tentative"]
      .map(csvEscape)
      .join(";"),
  ];

  for (const { profile, cases, academy } of getAllProfilesProgression()) {
    for (const c of cases.perCase) {
      if (c.attempts === 0) continue;
      rows.push(
        [
          profile.name,
          "cas_pratique",
          c.caseId,
          c.scenarioType,
          c.attempts,
          c.bestScore ?? "",
          c.bestMaxScore ?? "",
          c.lastSubmittedAt ?? "",
        ]
          .map(csvEscape)
          .join(";"),
      );
    }
    for (const m of academy.perModule) {
      if (m.attempts === 0) continue;
      rows.push(
        [
          profile.name,
          "academy_quiz",
          m.moduleId,
          m.title,
          m.attempts,
          m.bestScore ?? "",
          m.bestMaxScore ?? "",
          m.lastSubmittedAt ?? "",
        ]
          .map(csvEscape)
          .join(";"),
      );
    }
  }

  const csv = "﻿" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mutalia-rapport-progression.csv"`,
    },
  });
}
