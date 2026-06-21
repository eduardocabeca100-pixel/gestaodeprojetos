"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createTeamRoster, editTeamRoster } from "@/modules/team/actions";
import type { TeamRosterMember } from "@/modules/team/types";
import { teamRoles } from "@/modules/team/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamRosterFormProps {
  member?: TeamRosterMember;
  onSuccess?: (member: TeamRosterMember) => void;
}

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando..." : "Salvar membro"}
    </Button>
  );
}

export function TeamRosterForm({
  member,
  onSuccess,
}: TeamRosterFormProps) {
  const [selectedRole, setSelectedRole] = useState(member?.role || "");

  async function handleSubmit(formData: FormData) {
    formData.set("role", selectedRole);

    const result = member
      ? await editTeamRoster(member.id, formData)
      : await createTeamRoster(formData);

    if (result.ok && result.data) {
      onSuccess?.(result.data);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Nome completo
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={member?.name || ""}
          required
          placeholder="Ex: Júlia Silva"
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700">
          Função
        </label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            {teamRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={member?.email || ""}
            placeholder="email@exemplo.com"
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Telefone
          </label>
          <Input
            id="phone"
            name="phone"
            defaultValue={member?.phone || ""}
            placeholder="(11) 99999-9999"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="document" className="block text-sm font-medium text-slate-700">
          Documento (CPF/CNPJ)
        </label>
        <Input
          id="document"
          name="document"
          defaultValue={member?.document || ""}
          placeholder="000.000.000-00"
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
          Bio/Descrição
        </label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={member?.bio || ""}
          placeholder="Descreva a experiência e especialidades..."
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notas
        </label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={member?.notes || ""}
          placeholder="Anotações adicionais..."
          rows={2}
          className="mt-1"
        />
      </div>

      <FormButton />
    </form>
  );
}
