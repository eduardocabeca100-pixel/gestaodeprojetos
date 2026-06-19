import { reportTypes } from "@/modules/reports/types";

export function ReportOptionsForm() {
  return (
    <div className="grid gap-3">
      <select className="form-input" defaultValue="Dossiê completo do projeto">
        {reportTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      {[
        "Incluir fotos",
        "Incluir documentos",
        "Incluir financeiro",
        "Incluir participantes",
        "Incluir links externos",
      ].map((label) => (
        <label key={label} className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked />
          {label}
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
      </div>
    </div>
  );
}
