import { z } from "zod";
export const DraftSchema = z.object({
  caseId: z.string().max(100),
  completedObjectives: z.array(z.string().max(100)).max(10),
  selectedAnomalies: z.array(z.string().max(100)).max(30),
  values: z.record(z.string().max(60), z.string().max(100)),
  explanation: z.string().max(5000),
  qualifications: z
    .record(
      z.string().max(100),
      z.object({ type: z.string().max(100), beneficiary: z.string().max(100) }),
    )
    .default({}),
});
export type DraftInput = z.infer<typeof DraftSchema>;
export interface SavedDraft {
  revision: number;
  input: DraftInput;
  updatedAt: string;
}
