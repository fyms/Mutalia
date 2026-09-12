import { AmoStatementInputSchema } from "@/lib/domain/amoStatement";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/store/session";
import { generateAmoStatement,previewAmoFund } from "@/lib/services/amoStatementService";
import { revalidatePath } from "next/cache";
export async function POST(request:Request) {
 const session=await getAuthSession();if(!session)return new NextResponse(null,{status:401});
 try {
  const data=await request.json();
  if(typeof data.caseId!=="string"||!/^CASE-[0-9]+$/.test(data.caseId))return NextResponse.json({error:"Cas invalide."},{status:400});
  AmoStatementInputSchema.parse(data);
  if(data.operation==="preview")return NextResponse.json({fund:await previewAmoFund(session.userId,data.caseId)},{headers:{"Cache-Control":"private, no-store"}});
  const saved=await generateAmoStatement(session.userId,data);
  revalidatePath(`/cas-pratiques/${data.caseId}`);revalidatePath("/documents");
  return NextResponse.json(saved,{headers:{"Cache-Control":"private, no-store"}});
 } catch {return NextResponse.json({error:"Génération impossible : vérifiez bénéficiaire, NIR Démo, période, montants et longueur des textes."},{status:400});}
}
