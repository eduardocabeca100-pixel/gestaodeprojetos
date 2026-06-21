"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { assignTeamToProject } from "@/modules/team/actions";
import type { TeamRosterMember, PaymentStatus } from "@/modules/team/types";
import { paymentStatuses } from "@/modules/team/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamRosterSelectorProps {
  rosterMembers: TeamRosterMember[];
  projectId: string;
  onSuccess?: () => void;
}

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Adicionando..." : "Adicionar à equipe"}
    </Button>
  );
}

export function TeamRosterSelector({
  rosterMembers,
  projectId,
  onSuccess,
}: TeamRosterSelectorProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>("Previsto");

  async function handleSubmit(formData: FormData) {
    formData.set("projectId", projectId);
    formData.set("teamRosterId", selectedMemberId);
    formData.set("paymentStatus", selectedPaymentStatus);
    formData.set("paidAmount", "0");

    const result = await assignTeamToProject(formData);

    if (result.ok) {
      setSelectedMemberId("");
      setSelectedPaymentStatus("Previsto");
      formRef.current?.reset();
      onSuccess?.();
    }
  }

  const selectedMember = rosterMembers.find((m) => m.id === selectedMemberId);

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">Adicionar membro da equipe</h3>

      <div>
        <label htmlFor="member" className="block text-sm font-medium text-slate-700">
          Selecionar membro
        </label>
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Escolha um membro" />
          </SelectTrigger>
          <SelectContent>
            {rosterMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} - {member.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMember && (
        <div className="rounded bg-slate-100 p-3">
          <p className="text-xs text-slate-600">
            <span className="font-medium">{selectedMember.name}</span> • {selectedMember.role}
          </p>
          {selectedMember.email && (
            <p className="text-xs text-slate-500">{selectedMember.email}</p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="expectedAmount" className="block text-sm font-medium text-slate-700">
            Valor previsto (R$)
          </label>
          <Input
            id="expectedAmount"
            name="expectedAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Status de pagamento
          </label>
          <Select value={selectedPaymentStatus} onValueChange={(value) => setSelectedPaymentStatus(value as PaymentStatus)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormButton />
    </form>
  );
}
