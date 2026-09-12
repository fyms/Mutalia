import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/store/session";
import { readAmoStatement } from "@/lib/services/amoStatementService";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});
 const {id}=await params;
 if(!/^AMO-DEMO-[0-9a-f-]{36}$/.test(id))return new NextResponse(null,{status:404});
 const doc=readAmoStatement(session.userId,id);if(!doc)return new NextResponse(null,{status:404});
 return new Response(new Uint8Array(doc.pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`inline; filename="${doc.filename}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
