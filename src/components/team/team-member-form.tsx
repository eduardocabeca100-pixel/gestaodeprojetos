"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { paymentStatuses, teamRoles } from "@/modules/team/types";

export function TeamMemberForm() {
  const [feedback, setFeedback] = useState("Pronto para cadastrar equipe.");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(teamRoles[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [status, setStatus] = useState<string>(paymentStatuses[0]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setFeedback("Informe o nome do integrante da equipe.");
      return;
    }

    setFeedback(`Equipe ${name} cadastrada como ${role}.`);
    setName("");
    setRole(teamRoles[0]);
    setPhone("");
    setEmail("");
    setDocument("");
    setExpectedAmount("");
    setStatus(paymentStatuses[0]);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" />
      <select className="form-input" value={role} onChange={(event) => setRole(event.target.value)}>
        {teamRoles.map((role) => (
          <option key={role}>{role}</option>
        ))}
      </select>
      <input className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" />
      <input className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" />
      <input className="form-input" value={document} onChange={(event) => setDocument(event.target.value)} placeholder="CPF/CNPJ" />
      <input className="form-input" type="number" value={expectedAmount} onChange={(event) => setExpectedAmount(event.target.value)} placeholder="Valor previsto" />
      <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
        {paymentStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
      <Button type="submit">
        <Plus className="size-4" />
        Cadastrar equipe
      </Button>
    </form>
  );
}
