"use client";

import { useState } from "react";
import { LockKeyhole, Save } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/permissions";
import type { SettingsSection } from "@/modules/settings/types";

export function SettingsPanel({
  section,
  role,
}: {
  section: SettingsSection;
  role: Role;
}) {
  const isAdminLike = role === "admin" || role === "super_admin";
  const [feedback, setFeedback] = useState("Ajuste os campos e salve as alterações.");

  return (
    <SectionCard
      title={section.title}
      description={section.description}
      actions={
        <Button type="button" onClick={() => setFeedback(`Configurações de ${section.title} salvas localmente.`)}>
          <Save className="size-4" />
          Salvar
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {section.fields.map((field) => {
          const locked = !isAdminLike && field.lockedForDirector;

          return (
            <label key={field.label} className="block">
              <span className="mb-1 flex items-center gap-2 text-sm font-medium">
                {field.label}
                {locked ? <LockKeyhole className="size-3.5 text-amber-600" /> : null}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  className="form-input min-h-24"
                  defaultValue={field.value}
                  disabled={locked}
                />
              ) : field.type === "toggle" ? (
                <select className="form-input" defaultValue={field.value} disabled={locked}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              ) : field.type === "color" ? (
                <input
                  className="h-10 w-full rounded-lg border border-input bg-white px-2 py-1"
                  type="color"
                  defaultValue={field.value}
                  disabled={locked}
                />
              ) : field.type === "file" ? (
                <div className="rounded-lg border border-dashed border-border bg-white p-3">
                  <input
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                    type="file"
                    accept="image/*,.svg"
                    disabled={locked}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    PNG transparente, SVG ou JPG. Será salvo no bucket de configurações.
                  </p>
                </div>
              ) : field.type === "password" ? (
                <input
                  className="form-input"
                  type="password"
                  defaultValue={field.value}
                  disabled={locked}
                />
              ) : (
                <input
                  className="form-input"
                  type={field.type === "number" ? "number" : "text"}
                  defaultValue={field.value}
                  disabled={locked}
                />
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
    </SectionCard>
  );
}
