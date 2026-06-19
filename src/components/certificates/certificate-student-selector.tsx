"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import type { Participant } from "@/modules/participants/types";
import { cn } from "@/lib/utils";

export function CertificateStudentSelector({
  students,
  selectedIds,
  onChange,
}: {
  students: Participant[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return students;

    return students.filter((student) => {
      return [
        student.fullName,
        student.document,
        student.city,
        student.neighborhood,
        student.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [query, students]);

  function toggleStudent(studentId: string) {
    onChange(
      selectedIds.includes(studentId)
        ? selectedIds.filter((id) => id !== studentId)
        : [...selectedIds, studentId],
    );
  }

  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selecionar alunos</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Participantes do certificado</h3>
        </div>
        <button
          className="text-sm font-medium text-primary"
          type="button"
          onClick={() => onChange(students.map((student) => student.id))}
        >
          Selecionar todos
        </button>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Buscar aluno</span>
        <div className="form-input flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full border-0 bg-transparent p-0 outline-none ring-0"
            placeholder="Buscar por nome, CPF, cidade ou status"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </label>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {filteredStudents.map((student) => {
          const selected = selectedIds.includes(student.id);
          const attendanceRate = student.attendanceRate;

          return (
            <button
              key={student.id}
              type="button"
              className={cn(
                "rounded-lg border p-3 text-left transition",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-white hover:border-primary",
              )}
              onClick={() => toggleStudent(student.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{student.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {student.document || "CPF não informado"}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {student.status}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    attendanceRate >= 75
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {attendanceRate}% presença
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {student.city}
                {student.neighborhood ? ` • ${student.neighborhood}` : ""}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
