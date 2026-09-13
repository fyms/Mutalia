import { z } from 'zod';
import rawCatalog from './individualCatalog2026.json';
import consultationValues from './individual-consultation-values.json';

const reference = z.string().regex(/^(PSI|PLI)\d+$/);
const product = z.object({ reference, family: z.string().startsWith('Particuliers'), regime: z.string(), sourceFile: z.string(), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const common = { id: z.string(), reference, category: z.string(), benefit: z.string(), sourcePage: z.number().int().positive() };
const verified = z.object({ ...common, status: z.literal('verified'), reviewUnitId: z.string(), calculationMode: z.literal('fixed_amount'), value: z.number().nonnegative(), unit: z.string().min(1), condition: z.string().min(1), limit: z.string().min(1), verifiedBy: z.literal('document_review_2026') }).strict();
const pending = z.object({ ...common, status: z.literal('needs_review'), notice: z.literal('Donnée 2026 à vérifier') }).strict();
const missing = z.object({ ...common, status: z.literal('not_extracted'), notice: z.literal('Donnée 2026 à vérifier') }).strict();
const schema = z.object({ year: z.literal(2026), scope: z.literal('particuliers'), products: z.array(product), entries: z.array(z.discriminatedUnion('status', [verified, pending, missing])), excludedSynthesisRecords: z.number().int().nonnegative() }).strict();

/** Individual guarantees only. Existing documented CCN access remains separate. */
const documentarySchema = z.array(z.object({id:z.string(),reference,documentValue:z.string().min(1),sourceFile:z.string(),sourcePage:z.number().int().positive(),sourceSha256:z.string().regex(/^[a-f0-9]{64}$/),status:z.literal('needs_review')}).strict());
export function createIndividualCatalog(input: unknown, documentaryInput:unknown = []) {
  const data = schema.parse(input);
  const products = new Map(data.products.map(p => [p.reference, p]));
  if (products.size !== data.products.length || new Set(data.entries.map(e => e.id)).size !== data.entries.length || data.entries.some(e => !products.has(e.reference))) throw new Error('Invalid catalogue provenance or identities');
  const documentaryRows=documentarySchema.parse(documentaryInput);
  const documentary=new Map<string,typeof documentaryRows>();
  for(const row of documentaryRows)documentary.set(row.id,[...(documentary.get(row.id)??[]),row]);
  function documentValue(entry:typeof data.entries[number]) {
    if(entry.status!=='needs_review')return undefined;
    const rows=documentary.get(entry.id),p=products.get(entry.reference);
    if(!rows?.length||!p||rows.some(r=>r.reference!==entry.reference||r.sourceFile!==p.sourceFile||r.sourceSha256!==p.sourceSha256||r.sourcePage!==entry.sourcePage)||new Set(rows.map(r=>r.documentValue)).size!==1)return undefined;
    return rows[0].documentValue;
  }
  function context<T extends typeof data.entries[number]>(entry: T) {
    return structuredClone({ ...entry, ...products.get(entry.reference)! });
  }
  return {
    listProducts() { return structuredClone(data.products); },
    /** Consultation excludes uninterpreted placeholders and never exposes pending numeric guarantees. */
    listForConsultation(productReference: string) {
      return data.entries.filter(e => e.reference === productReference && e.status !== 'not_extracted').map(e=>({...context(e),documentValue:documentValue(e)}));
    },
    /** Only documented amounts are eligible; callers must still enforce the returned conditions/limits. */
    getCalculableGuarantee(productReference: string, id: string) {
      const entry = data.entries.find(e => e.reference === productReference && e.id === id);
      return entry?.status === 'verified' ? context(entry) : undefined;
    },
    listCalculableGuarantees(productReference: string) {
      return data.entries.filter((e): e is z.infer<typeof verified> => e.reference === productReference && e.status === 'verified').map(context);
    },
    getCoverage(productReference: string) {
      const entries = data.entries.filter(e => e.reference === productReference);
      return { verified: entries.filter(e => e.status === 'verified').length, needs_review: entries.filter(e => e.status === 'needs_review').length, not_extracted: entries.filter(e => e.status === 'not_extracted').length };
    },
  };
}

export const individualCatalog2026 = createIndividualCatalog(rawCatalog, consultationValues);
