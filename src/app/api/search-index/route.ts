import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/domain/search";

export async function GET() {
  return NextResponse.json(buildSearchIndex());
}
