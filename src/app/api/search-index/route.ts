import { getAuthSession } from "@/lib/store/session";
import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/domain/search";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return new NextResponse(null, { status: 401 });
  return NextResponse.json(buildSearchIndex(session.userId), { headers: { "Cache-Control": "private, no-store" } });
}
