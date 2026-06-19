import { z } from "zod";

import { participantStatuses } from "./types";

export const participantSchema = z.object({
  projectId: z.string().min(1),
  fullName: z.string().min(2),
  document: z.string().optional(),
  birthDate: z.string().min(8),
  phone: z.string().min(8),
  email: z.email().optional().or(z.literal("")),
  neighborhood: z.string().min(2),
  address: z.string().min(2),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  imageAuthorization: z.coerce.boolean(),
  participationAuthorization: z.coerce.boolean(),
  pedagogicalNotes: z.string().optional(),
  status: z.enum(participantStatuses),
});
