import { z } from "zod";

import { officialDocumentTemplates } from "./types";

export const officialDocumentSchema = z.object({
  projectId: z.string().min(1),
  template: z.enum(officialDocumentTemplates),
  title: z.string().min(3),
  code: z.string().min(3),
  date: z.string().min(8),
  subject: z.string().min(3),
  status: z.enum(["Rascunho", "Finalizado", "Assinado", "Arquivado"]),
  recipient: z.string().optional(),
  recipientRole: z.string().optional(),
  institution: z.string().optional(),
  signerOne: z.string().optional(),
  signerOneRole: z.string().optional(),
  signerTwo: z.string().optional(),
  signerTwoRole: z.string().optional(),
  content: z.string().min(10),
});
