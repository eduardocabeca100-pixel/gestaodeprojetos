import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { activityStatuses, activityTypes } from "@/modules/schedule/types";

export function ActivityForm() {
  return (
    <form className="grid gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-2">
      <input className="form-input" placeholder="Título" />
      <select className="form-input" defaultValue="Aula">
        {activityTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input className="form-input" type="date" />
      <input className="form-input" placeholder="Local" />
      <input className="form-input" placeholder="Responsável" />
      <select className="form-input" defaultValue="Agendada">
        {activityStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <div className="sm:col-span-2">
        <Button type="button">
          <Plus className="size-4" />
          Criar atividade
        </Button>
      </div>
    </form>
  );
}
