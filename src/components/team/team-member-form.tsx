import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { paymentStatuses, teamRoles } from "@/modules/team/types";

export function TeamMemberForm() {
  return (
    <form className="grid gap-3">
      <input className="form-input" placeholder="Nome" />
      <select className="form-input" defaultValue="Professor/formador">
        {teamRoles.map((role) => (
          <option key={role}>{role}</option>
        ))}
      </select>
      <input className="form-input" placeholder="Telefone" />
      <input className="form-input" placeholder="E-mail" />
      <input className="form-input" placeholder="CPF/CNPJ" />
      <input className="form-input" type="number" placeholder="Valor previsto" />
      <select className="form-input" defaultValue="Previsto">
        {paymentStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <Button type="button">
        <Plus className="size-4" />
        Cadastrar equipe
      </Button>
    </form>
  );
}
