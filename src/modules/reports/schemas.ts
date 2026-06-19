import { z } from "zod";

import { reportTypes } from "./types";

export const reportOptionsSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(reportTypes),
  includePhotos: z.coerce.boolean(),
  includeDocuments: z.coerce.boolean(),
  includeFinance: z.coerce.boolean(),
  includeParticipants: z.coerce.boolean(),
  includeExternalLinks: z.coerce.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
