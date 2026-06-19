"use server";

import { budgetItemSchema, expenseSchema } from "./schemas";

export async function saveBudgetItem(formData: FormData) {
  const parsed = budgetItemSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise a rubrica.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Rubrica validada." };
}

export async function saveExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise a despesa.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Despesa validada." };
}
