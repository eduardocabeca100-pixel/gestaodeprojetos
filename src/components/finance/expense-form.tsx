"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { expenseStatuses, receiptTypes } from "@/modules/finance/types";

export function ExpenseForm() {
  const [feedback, setFeedback] = useState("Pronto para cadastrar despesa.");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [document, setDocument] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [receiptType, setReceiptType] = useState<string>(receiptTypes[0]);
  const [status, setStatus] = useState<string>(expenseStatuses[0]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!description.trim() || !amount.trim()) {
      setFeedback("Informe descrição e valor para salvar a despesa.");
      return;
    }

    setFeedback(`Despesa ${description} preparada no valor de R$ ${amount}.`);
    setDescription("");
    setSupplier("");
    setDocument("");
    setAmount("");
    setDate("");
    setReceiptType(receiptTypes[0]);
    setStatus(expenseStatuses[0]);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input className="form-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição da despesa" />
      <input className="form-input" value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Fornecedor/prestador" />
      <input className="form-input" value={document} onChange={(event) => setDocument(event.target.value)} placeholder="CPF/CNPJ" />
      <input className="form-input" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Valor" />
      <input className="form-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <select className="form-input" value={receiptType} onChange={(event) => setReceiptType(event.target.value)}>
        {receiptTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
        {expenseStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
      <Button type="submit">
        <Plus className="size-4" />
        Cadastrar despesa
      </Button>
    </form>
  );
}
