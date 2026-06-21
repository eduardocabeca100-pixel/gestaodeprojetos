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
    "super_admin",
    "diretor_executivo",
    "financeiro",
    "editor_projeto",
    "equipe_tecnica",
    "visualizador",
  ]),
  is_active: z.boolean(),
  must_change_password: z.boolean().optional(),
});

export const passwordResetSchema = z
  .object({
    password: z.string().min(8, "Informe uma senha com pelo menos 8 caracteres."),
    confirmation: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmation, {
    message: "As senhas não coincidem.",
    path: ["confirmation"],
  });

export const createUserSchema = z
  .object({
    name: z.string().min(2, "Informe o nome da pessoa."),
    email: z.email("Informe um e-mail válido."),
    role: z.enum([
      "admin",
      "super_admin",
      "diretor_executivo",
    ]),
    tempPassword: z.string().min(8, "A senha temporária precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a senha temporária."),
    mustChangePassword: z.coerce.boolean(),
    projectIds: z.array(z.string()).default([]),
  })
  .refine((data) => data.tempPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      ["admin", "super_admin"].includes(data.role) ||
      data.projectIds.length > 0,
    {
      message: "Selecione ao menos um projeto para este usuário.",
      path: ["projectIds"],
    },
  );
