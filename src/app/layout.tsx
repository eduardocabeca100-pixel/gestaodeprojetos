import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIVA Gestão Cultural",
  description:
    "Plataforma privada para gestão de projetos culturais, documentos, financeiro e prestação de contas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full overflow-x-hidden antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
