import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { participantStatuses } from "@/modules/participants/types";

export function ParticipantForm() {
  return (
    <form className="grid gap-3">
      <input className="form-input" placeholder="Nome completo" />
      <input className="form-input" placeholder="CPF" />
      <input className="form-input" type="date" />
      <input className="form-input" placeholder="Telefone" />
      <input className="form-input" placeholder="E-mail" />
      <input className="form-input" placeholder="Bairro" />
      <select className="form-input" defaultValue="Inscrito">
        {participantStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked />
        Autorização de participação
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" />
        Autorização de imagem
      </label>
      <Button type="button">
        <Plus className="size-4" />
        Cadastrar participante
      </Button>
    </form>
  );
}
