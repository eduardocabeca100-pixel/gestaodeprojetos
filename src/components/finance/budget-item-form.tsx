"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { budgetCategories } from "@/modules/finance/types";

export function BudgetItemForm() {
  const [feedback, setFeedback] = useState("Pronto para adicionar rubrica.");
  const [category, setCategory] = useState<(typeof budgetCategories)[number]>(budgetCategories[0]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setFeedback("Informe o nome da rubrica.");
      return;
    }

    setFeedback(`Rubrica ${name} cadastrada na categoria ${category}.`);
    setCategory(budgetCategories[0]);
    setName("");
    setValue("");
    setNotes("");
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value as (typeof budgetCategories)[number])}>
        {budgetCategories.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da rubrica" />
      <input className="form-input" type="number" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Valor aprovado" />
      <textarea className="form-input min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observação" />
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
      <Button type="submit" variant="outline">
        <Plus className="size-4" />
        Adicionar rubrica
      </Button>
    </form>
  );
}
