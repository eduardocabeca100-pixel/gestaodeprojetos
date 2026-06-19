import { z } from "zod";

import { documentCategories, documentStatuses } from "./types";

export const documentSchema = z.object({
  fileName: z.string().min(3),
  category: z.enum(documentCategories),
  projectId: z.string().min(1),
  linkedTo: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(documentStatuses),
});
