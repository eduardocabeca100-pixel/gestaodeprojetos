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
  return (
    <SectionCard
      title={section.title}
      description={section.description}
      actions={
        <Button type="button">
          <Save className="size-4" />
          Salvar
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {section.fields.map((field) => {
          const locked = role !== "admin" && field.lockedForDirector;

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
    </SectionCard>
  );
}
