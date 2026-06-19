import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { expenseStatuses, receiptTypes } from "@/modules/finance/types";

export function ExpenseForm() {
  return (
    <form className="grid gap-3">
      <input className="form-input" placeholder="Descrição da despesa" />
      <input className="form-input" placeholder="Fornecedor/prestador" />
      <input className="form-input" placeholder="CPF/CNPJ" />
      <input className="form-input" type="number" placeholder="Valor" />
      <input className="form-input" type="date" />
      <select className="form-input" defaultValue="Nota fiscal de serviço">
        {receiptTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <select className="form-input" defaultValue="Previsto">
        {expenseStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <Button type="button">
        <Plus className="size-4" />
        Cadastrar despesa
      </Button>
    </form>
  );
}
