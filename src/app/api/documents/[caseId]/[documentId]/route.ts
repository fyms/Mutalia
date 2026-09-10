import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/store/session";
import { getSourceCase } from "@/lib/data/loaders";
import fs from "node:fs";
import path from "node:path";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string; documentId: string }> },
) {
  const s = await getAuthSession();
  if (!s) return new NextResponse(null, { status: 401 });
  const { caseId, documentId } = await params;
  const c = getSourceCase(caseId);
  const d = c?.documents.find((x) => x.document_id === documentId);
  if (!c?.visible_in_learner_mode || !d)
    return new NextResponse(null, { status: 404 });
  const bytes = fs.readFileSync(
        path.join(
          process.cwd(),
          "src/lib/data/private/documents",
          caseId,
          d.file_name,
        ),
      );
  if (!bytes) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="piece.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
