import { z } from "zod";

import { projectStatuses } from "./types";

export const projectSchema = z.object({
  name: z.string().min(2, "Informe o nome do projeto."),
  fullTitle: z.string().min(5, "Informe o título completo."),
  slug: z.string().min(2, "Informe um slug válido."),
  shortDescription: z.string().min(10, "Inclua uma descrição curta."),
  summary: z.string().min(20, "Inclua um resumo do projeto."),
  edital: z.string().min(2, "Informe o edital."),
  registrationNumber: z.string().min(1, "Informe o número da inscrição."),
  approvedAmount: z.number().min(0),
  executedAmount: z.number().min(0),
  status: z.enum(projectStatuses),
  currentStage: z.string().min(2),
  modality: z.string().min(2),
  className: z.string().min(2),
  proponent: z.string().min(2),
  proponentDocument: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
