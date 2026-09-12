import "server-only";
import { db } from "@/lib/db";
import { createFundResolver, type FundCache } from "./healthInsuranceFund";
db.exec("CREATE TABLE IF NOT EXISTS official_fund_cache (cache_key TEXT PRIMARY KEY, fetched_at INTEGER NOT NULL, payload TEXT NOT NULL)");
const cache:FundCache={
 get(key){const row=db.prepare("SELECT fetched_at,payload FROM official_fund_cache WHERE cache_key=?").get(key) as {fetched_at:number;payload:string}|undefined;return row?{at:row.fetched_at,value:JSON.parse(row.payload)}:undefined;},
 set(key,value,at){db.prepare("INSERT INTO official_fund_cache(cache_key,fetched_at,payload) VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET fetched_at=excluded.fetched_at,payload=excluded.payload").run(key,at,JSON.stringify(value));},
};
export const resolveHealthInsuranceFund=createFundResolver({cache});
