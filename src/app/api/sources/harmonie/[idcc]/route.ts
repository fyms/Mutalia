import { readFile } from "node:fs/promises";
import path from "node:path";
import { getConvention } from "@/lib/data/harmonie/conventions";
export async function GET(_request: Request, { params }: { params: Promise<{idcc: string}> }) {
  const convention = getConvention((await params).idcc);
  if (!convention) return new Response("Source introuvable", {status:404});
  const bytes = await readFile(path.join(process.cwd(),"data/sources/harmonie/2026",convention.file));
  return new Response(bytes, {headers:{"Content-Type":"application/pdf","Content-Disposition":"inline","X-Content-Type-Options":"nosniff"}});
}
