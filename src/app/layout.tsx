import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMPI - Sistema Integrado de Movimentação Patrimonial e Inventário",
  description: "Gestão, transferência e rastreabilidade contínua de bens patrimoniais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans text-slate-800 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
