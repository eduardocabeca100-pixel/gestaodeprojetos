import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim(),
  password: z.string().min(6, "Informe uma senha com pelo menos 6 caracteres."),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  role: z.enum([
    "admin",
    "diretor_executivo",
    "financeiro",
    "editor_projeto",
    "equipe_tecnica",
    "visualizador",
  ]),
  is_active: z.boolean(),
});
