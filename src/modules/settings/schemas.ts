import { z } from "zod";

export const settingFieldSchema = z.object({
  label: z.string().min(2),
  value: z.string(),
  type: z.enum(["text", "textarea", "toggle", "color", "number", "select"]),
  lockedForDirector: z.boolean().optional(),
});

export const settingsSectionSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  fields: z.array(settingFieldSchema),
});
