import { getAuthSession } from "@/lib/store/session";
import { NextResponse } from "next/server";
import { buildSearchIndex, searchByDemoNir } from "@/lib/domain/search";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return new NextResponse(null, { status: 401 });
  return NextResponse.json(buildSearchIndex(session.userId), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request:Request) {
 const session=await getAuthSession();
 if (!session) return new NextResponse(null,{status:401});
 try { const {query}=await request.json();
  if (typeof query!=="string" || query.length>50) return NextResponse.json([],{status:400});
  return NextResponse.json(searchByDemoNir(session.userId,query),{headers:{"Cache-Control":"private, no-store"}});
 } catch {return NextResponse.json([],{status:400});}
}
