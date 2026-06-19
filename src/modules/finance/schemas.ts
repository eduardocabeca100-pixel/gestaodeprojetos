import { z } from "zod";

import { budgetCategories, expenseStatuses } from "./types";

export const budgetItemSchema = z.object({
  projectId: z.string().min(1),
  category: z.enum(budgetCategories),
  name: z.string().min(2),
  approvedAmount: z.coerce.number().min(0),
  executedAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  projectId: z.string().min(1),
  budgetItemId: z.string().min(1),
  description: z.string().min(3),
  supplier: z.string().min(2),
  document: z.string().min(5),
  amount: z.coerce.number().min(0.01),
  paidAt: z.string().min(8),
  paymentMethod: z.string().min(2),
  status: z.enum(expenseStatuses),
  notes: z.string().optional(),
});
