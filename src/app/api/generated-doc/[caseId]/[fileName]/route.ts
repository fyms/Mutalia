import { NextResponse } from "next/server";
import { readGeneratedPdf } from "@/lib/domain/pdfGenerator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string; fileName: string }> },
) {
  const { caseId, fileName } = await params;
  const bytes = readGeneratedPdf(caseId, fileName);
  if (!bytes) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
