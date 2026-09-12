import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/store/session";
import { readRuntimeDocument,deleteUploadedDocument,setRuntimeDocumentStatus } from "@/lib/store/runtimeDocuments";
import { revalidatePath } from "next/cache";
type Context={params:Promise<{householdId:string;documentId:string}>};
export async function GET(_request:Request,{params}:Context){
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});
 const {householdId,documentId}=await params;
 try{const document=readRuntimeDocument(session.userId,householdId,documentId);if(!document)return new NextResponse(null,{status:404});
  return new Response(new Uint8Array(document.bytes),{headers:{"Content-Type":document.record.mimeType,"Content-Disposition":`inline; filename="document.${document.record.mimeType==="application/pdf"?"pdf":document.record.mimeType==="image/png"?"png":"jpg"}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox"}});
 }catch{return new NextResponse(null,{status:404});}
}
export async function DELETE(request:Request,{params}:Context){
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});const {householdId,documentId}=await params;
 try{const {confirmed}=await request.json();deleteUploadedDocument(session.userId,householdId,documentId,confirmed);revalidatePath("/","layout");return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"Suppression interdite ou non confirmée."},{status:400});}
}
export async function PATCH(request:Request,{params}:Context){
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});const {householdId,documentId}=await params;
 try{const {status}=await request.json();setRuntimeDocumentStatus(session.userId,householdId,documentId,status);revalidatePath("/","layout");return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"Qualification impossible."},{status:400});}
}
