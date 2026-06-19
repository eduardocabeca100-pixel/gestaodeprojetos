import { FileText, Receipt, Upload } from "lucide-react";

export function ReceiptUpload() {
  const items = [
    "Nota fiscal de serviço",
    "Nota fiscal de material",
    "Cupom fiscal",
    "Recibo/RPA para prestador PF",
    "Recibo simples para ator/artista",
    "Comprovante de pagamento",
  ];

  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm">
      <Upload className="mb-2 size-5 text-primary" />
      <p className="font-medium">Anexos financeiros obrigatórios</p>
      <p className="mt-1 text-muted-foreground">
        Cada despesa pode ter nota, cupom, recibo e comprovante bancário vinculados.
      </p>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 p-3"
          >
            {item.includes("Recibo") || item.includes("Comprovante") ? (
              <Receipt className="size-4 text-emerald-700" />
            ) : (
              <FileText className="size-4 text-primary" />
            )}
            <span className="min-w-0 flex-1">{item}</span>
            <input className="hidden" type="file" />
            <span className="rounded-md bg-white px-2 py-1 text-xs text-muted-foreground">
              Anexar
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
