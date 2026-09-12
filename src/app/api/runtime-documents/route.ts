import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/store/session";
import { uploadDocument } from "@/lib/store/runtimeDocuments";
import { MAX_UPLOAD_SIZE,documentView } from "@/lib/domain/runtimeDocuments";
import { revalidatePath } from "next/cache";
export async function POST(request:Request){
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});
 try{
  const limit=MAX_UPLOAD_SIZE+65536;
  if(Number(request.headers.get("content-length"))>limit)return NextResponse.json({error:"Maximum 10 Mo par fichier."},{status:413});
  const reader=request.body?.getReader();if(!reader)throw new Error("Fichier requis.");
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>limit){await reader.cancel();return NextResponse.json({error:"Maximum 10 Mo par fichier."},{status:413});}chunks.push(value);}
  const data=await new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("content-type")??""},body:new Uint8Array(Buffer.concat(chunks))}).formData();
  const file=data.get("file");if(!(file instanceof File))throw new Error("Fichier requis.");
  if(file.size>MAX_UPLOAD_SIZE)return NextResponse.json({error:"Maximum 10 Mo par fichier."},{status:413});
  if(data.get("fictional")!=="true")throw new Error("Confirmez que le document est fictif.");
  const record=uploadDocument(session.userId,Object.fromEntries(data),file,new Uint8Array(await file.arrayBuffer()));
  revalidatePath("/","layout");return NextResponse.json(documentView(record),{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"Import refusé. Vérifiez PDF/JPEG/PNG, contenu, taille ≤ 10 Mo, nom sans NIR/IBAN, dossier, bénéficiaire et date."},{status:400});}
}
