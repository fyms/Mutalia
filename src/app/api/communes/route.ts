import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/store/session";

const communeSchema = z.object({
  nom: z.string(), code: z.string(), codeDepartement: z.string(), codesPostaux: z.array(z.string()),
});
export async function GET(request: Request) {
  if (!await getAuthSession()) return new NextResponse(null, {status: 401});
  const codePostal = new URL(request.url).searchParams.get("codePostal") ?? "";
  if (!/^[0-9]{5}$/.test(codePostal)) return NextResponse.json({error: "Code postal : 5 chiffres requis."}, {status: 400});
  try {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code,codeDepartement,codesPostaux`, {
      next: {revalidate: 86400}, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Service indisponible");
    const rows = z.array(communeSchema).parse(await response.json());
    const communes = [...new Map(rows.map(row => [row.code, row])).values()]
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.code.localeCompare(b.code));
    return NextResponse.json(communes, {headers: {"Cache-Control": "private, max-age=3600"}});
  } catch {
    return NextResponse.json({error: "Service des communes temporairement indisponible"}, {status: 503});
  }
}
