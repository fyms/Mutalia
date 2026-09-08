import "server-only";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/constants";
import type { CaseDocument, Member } from "@/lib/domain/types";

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
