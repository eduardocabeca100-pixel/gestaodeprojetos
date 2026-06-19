import { z } from "zod";

import { activityStatuses, activityTypes } from "./types";

export const activitySchema = z.object({
  title: z.string().min(3),
  projectId: z.string().min(1),
  type: z.enum(activityTypes),
  date: z.string().min(8),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  location: z.string().min(2),
  responsible: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(activityStatuses),
  notes: z.string().optional(),
});
