import { FileSignature } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReceiptGenerator() {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <FileSignature className="size-5" />
        </div>
        <div>
          <p className="font-semibold">Gerador de recibo</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Para atores, artistas e prestadores pessoa física sem nota fiscal.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <select className="form-input" defaultValue="Recibo de ator/artista">
          <option>Recibo de ator/artista</option>
          <option>Recibo de prestador PF</option>
          <option>RPA</option>
          <option>Declaração de prestação de serviço</option>
        </select>
        <input className="form-input" placeholder="Nome do recebedor" />
        <input className="form-input" placeholder="CPF" />
        <input className="form-input" type="number" placeholder="Valor bruto" />
        <textarea
          className="form-input min-h-20"
          placeholder="Descrição do serviço prestado"
        />
        <Button type="button" variant="outline">
          <FileSignature className="size-4" />
          Preparar recibo
        </Button>
      </div>
    </div>
  );
}
