import { getSession } from "@/lib/store/session";
import { RelationHistory } from "@/components/relation/RelationHistory";
export default async function RelationAdherentPage() {
 const {userId}=await getSession();return <div className="space-y-4"><h1 className="text-2xl font-semibold">Relation adhérent & Réclamations</h1><RelationHistory owner={userId}/></div>;
}
