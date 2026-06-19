import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { participantStatuses } from "@/modules/participants/types";

export function ParticipantForm() {
  return (
    <form className="grid gap-4 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="text-sm font-medium">Nome completo</span>
        <input className="form-input mt-1" placeholder="Nome completo" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">CPF</span>
        <input className="form-input mt-1" placeholder="CPF" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Data de nascimento</span>
        <input className="form-input mt-1" type="date" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Telefone</span>
        <input className="form-input mt-1" placeholder="Telefone" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">E-mail</span>
        <input className="form-input mt-1" placeholder="E-mail" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Cidade</span>
        <input className="form-input mt-1" placeholder="Cidade" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Bairro</span>
        <input className="form-input mt-1" placeholder="Bairro" />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium">Endereço</span>
        <input className="form-input mt-1" placeholder="Endereço completo" />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium">Foto do participante</span>
        <input className="form-input mt-1" type="file" accept="image/*" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Autorização de imagem</span>
        <input className="form-input mt-1" type="file" accept=".pdf,image/*" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Termo de participação / gravação</span>
        <input className="form-input mt-1" type="file" accept=".pdf,image/*" />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium">Status</span>
        <select className="form-input mt-1" defaultValue="Inscrito">
          {participantStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" defaultChecked />
        Autorização de participação
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" />
        Autorização de imagem
      </label>
      <Button type="button" className="md:col-span-2">
        <Plus className="size-4" />
        Cadastrar participante
      </Button>
    </form>
  );
}
