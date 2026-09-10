import { getAuthSession } from "@/lib/store/session";
import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/domain/search";

export async function GET() {
  if (!(await getAuthSession())) return new NextResponse(null, { status: 401 });
  return NextResponse.json(buildSearchIndex(), { headers: { "Cache-Control": "private, no-store" } });
}
