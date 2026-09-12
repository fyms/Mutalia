import "server-only";
import fs from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/db";
/** Replace this binary adapter with object storage without changing document metadata. */
export interface DocumentFiles {write(key:string,bytes:Uint8Array):void;read(key:string):Buffer;remove(key:string):void;}
export const uploadDirectory=path.join(dataDir,"uploads");
function filePath(key:string) {
 if(!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(key))throw new Error("Clé documentaire invalide.");
 return path.join(uploadDirectory,key);
}
export const documentFiles:DocumentFiles={
 write(key,bytes){fs.mkdirSync(uploadDirectory,{recursive:true,mode:0o700});fs.writeFileSync(filePath(key),bytes,{mode:0o600,flag:"wx"});},
 read(key){return fs.readFileSync(filePath(key));},
 remove(key){fs.unlinkSync(filePath(key));},
};
