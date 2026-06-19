"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { activityStatuses, activityTypes } from "@/modules/schedule/types";

export function ActivityForm() {
  const [feedback, setFeedback] = useState("Pronto para criar atividade.");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(activityTypes[0]);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [responsible, setResponsible] = useState("");
  const [status, setStatus] = useState<string>(activityStatuses[0]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setFeedback("Informe o título da atividade.");
      return;
    }

    setFeedback(`Atividade ${title} criada com status ${status}.`);
    setTitle("");
    setType(activityTypes[0]);
    setDate("");
    setLocation("");
    setResponsible("");
    setStatus(activityStatuses[0]);
  }

  return (
    <form className="grid gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" />
      <select className="form-input" value={type} onChange={(event) => setType(event.target.value)}>
        {activityTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input className="form-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <input className="form-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Local" />
      <input className="form-input" value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="Responsável" />
      <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
        {activityStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <div className="sm:col-span-2">
        <div className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {feedback}
        </div>
        <Button type="submit">
          <Plus className="size-4" />
          Criar atividade
        </Button>
      </div>
    </form>
  );
}
