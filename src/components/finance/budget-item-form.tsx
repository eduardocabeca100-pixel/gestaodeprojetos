import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { budgetCategories } from "@/modules/finance/types";

export function BudgetItemForm() {
  return (
    <form className="grid gap-3">
      <select className="form-input" defaultValue="Recursos humanos">
        {budgetCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input className="form-input" placeholder="Nome da rubrica" />
      <input className="form-input" type="number" placeholder="Valor aprovado" />
      <textarea className="form-input min-h-20" placeholder="Observação" />
      <Button type="button" variant="outline">
        <Plus className="size-4" />
        Adicionar rubrica
      </Button>
    </form>
  );
}
