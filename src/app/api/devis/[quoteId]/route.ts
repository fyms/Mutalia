import { NextResponse } from "next/server";
import { buildQuotePdf } from "@/lib/domain/pdfGenerator";
import { getClientById, getQuoteById } from "@/lib/store/runtimeStore";
import { getAuthSession } from "@/lib/store/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { quoteId } = await params;
  const quote = getQuoteById(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  const client = getClientById(quote.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const bytes = await buildQuotePdf(quote, client);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${quote.id}.pdf"`,
    },
  });
}
