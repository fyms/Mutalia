import { getSession } from "@/lib/store/session";
import { CotisationHistory } from "@/components/cotisations/CotisationHistory";
export default async function CotisationsPage() {
 const {userId}=await getSession();return <div className="space-y-4"><h1 className="text-2xl font-semibold">Cotisations</h1><CotisationHistory owner={userId} allowCreate/></div>;
}
