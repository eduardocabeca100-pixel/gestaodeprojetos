import { Upload } from "lucide-react";

export function ReceiptUpload() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm">
      <Upload className="mb-2 size-5 text-primary" />
      <p className="font-medium">Comprovante e nota/recibo</p>
      <p className="mt-1 text-muted-foreground">
        Arquivos vinculados à despesa no bucket documents.
      </p>
    </div>
  );
}
