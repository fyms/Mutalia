import "server-only";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
import type { CaseDocument, Member } from "@/lib/domain/types";
import type { ClientRecord, QuoteRecord } from "@/lib/store/runtimeStore";

const GENERATED_DIR = path.join(process.cwd(), ".data", "generated-pdfs");

const WARNING = "DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR";

export async function buildExerciseDocumentPdf(
  document: CaseDocument,
  beneficiary: Member | undefined,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 594]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 560;
  page.drawText(WARNING, { x: 30, y, size: 8.5, font: bold, color: rgb(0.48, 0.12, 0.12) });
  y -= 30;
  const title = DOCUMENT_TYPE_LABELS[document.document_type] ?? document.document_type;
  page.drawText(`Pièce d'exercice - ${title}`, { x: 30, y, size: 14, font: bold });
  y -= 30;

  const rows: [string, string][] = [
    ["Dossier", document.case_id],
    ["Type de document", title],
    ["Bénéficiaire", beneficiary ? `${beneficiary.first_name} ${beneficiary.last_name}` : "Non renseigné"],
    ["Rôle", beneficiary?.role ?? "—"],
    ["Date du document", document.document_date ?? "—"],
    ["Statut initial", "Importé"],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: 30, y, size: 9, font: bold });
    page.drawText(value, { x: 180, y, size: 9, font });
    y -= 20;
  }

  y -= 10;
  page.drawText(
    "Document synthétique Mutalia sans valeur administrative, médicale ou bancaire.",
    { x: 30, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) },
  );

  return pdf.save();
}

export async function buildQuotePdf(quote: QuoteRecord, client: ClientRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 594]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const adherent = client.household.members.find((m) => m.role === "adherent");

  let y = 560;
  page.drawText(WARNING, { x: 30, y, size: 8.5, font: bold, color: rgb(0.48, 0.12, 0.12) });
  y -= 30;
  page.drawText("Devis indicatif - Complémentaire santé particuliers", { x: 30, y, size: 13, font: bold });
  y -= 24;

  const dateFmt = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(iso),
    );

  const rows: [string, string][] = [
    ["Référence devis", quote.id],
    ["Souscripteur", adherent ? `${adherent.first_name} ${adherent.last_name}` : "—"],
    ["Bénéficiaires du foyer", String(client.household.members.length)],
    ["Catalogue de référence", quote.formulaCatalog === "pli_verifie" ? "Comparateur vérifié (codes PLI)" : "Architecture PSI 2026"],
    ["Formule de garantie", quote.formulaCode],
    ["Édité le", dateFmt(quote.createdAt)],
    ["Valable jusqu'au", dateFmt(quote.validUntil)],
    ["Édité par", quote.createdBy],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: 30, y, size: 9, font: bold });
    page.drawText(value, { x: 200, y, size: 9, font });
    y -= 20;
  }

  y -= 10;
  page.drawText("Cotisation mensuelle proposée", { x: 30, y, size: 10, font: bold });
  y -= 20;
  if (quote.monthlyPremium !== null) {
    page.drawText(
      `${quote.monthlyPremium.toFixed(2)} EUR / mois`,
      { x: 30, y, size: 14, font: bold, color: rgb(0.05, 0.35, 0.2) },
    );
    y -= 18;
    page.drawText(
      "Montant saisi manuellement par le conseiller (outil de tarification externe) — non issu",
      { x: 30, y, size: 7.5, font, color: rgb(0.35, 0.35, 0.35) },
    );
    y -= 11;
    page.drawText(
      "automatiquement du référentiel officiel Harmonie Mutuelle 2026.",
      { x: 30, y, size: 7.5, font, color: rgb(0.35, 0.35, 0.35) },
    );
    y -= 18;
  } else {
    page.drawText("Donnée 2026 à vérifier", { x: 30, y, size: 11, font: bold, color: rgb(0.6, 0.42, 0.05) });
    y -= 18;
    page.drawText(
      "Aucun tarif saisi par le conseiller pour cette formule à ce stade.",
      { x: 30, y, size: 7.5, font, color: rgb(0.35, 0.35, 0.35) },
    );
    y -= 18;
  }

  y -= 12;
  page.drawText(
    "Document pédagogique Mutalia : ne constitue ni une offre contractuelle, ni un document",
    { x: 30, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) },
  );
  y -= 11;
  page.drawText(
    "opposable. Aucune valeur bancaire, médicale ou administrative.",
    { x: 30, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) },
  );

  return pdf.save();
}

export function generatedPdfPath(caseId: string, fileName: string): string {
  return path.join(GENERATED_DIR, caseId, fileName);
}

export async function saveGeneratedPdf(caseId: string, fileName: string, bytes: Uint8Array): Promise<void> {
  const dir = path.join(GENERATED_DIR, caseId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(generatedPdfPath(caseId, fileName), bytes);
}

export function readGeneratedPdf(caseId: string, fileName: string): Buffer | undefined {
  const filePath = generatedPdfPath(caseId, fileName);
  if (!fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath);
}
