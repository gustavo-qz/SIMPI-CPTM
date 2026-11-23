'use client';

import { Printer } from 'lucide-react';

export default function BotaoImprimirAcao() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      <span>Imprimir / Salvar PDF (A4)</span>
    </button>
  );
}
