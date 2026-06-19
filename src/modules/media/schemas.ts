import { z } from "zod";

import { mediaCategories, mediaTypes } from "./types";

export const mediaSchema = z.object({
  title: z.string().min(2),
  type: z.enum(mediaTypes),
  projectId: z.string().min(1),
  activityId: z.string().optional(),
  registeredAt: z.string().min(8),
  location: z.string().optional(),
  description: z.string().optional(),
  url: z.string().min(3),
  category: z.enum(mediaCategories),
  selectedForDossier: z.coerce.boolean().optional(),
});
