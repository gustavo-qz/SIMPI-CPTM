'use client';

import { Printer } from 'lucide-react';
import Link from 'next/link';

interface Props {
  transferenciaId: string;
}

export default function BotaoImprimirGuia({ transferenciaId }: Props) {
  return (
    <Link
      href={`/transferencias/${transferenciaId}/imprimir`}
      target="_blank"
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-700 hover:text-blue-700 text-xs font-semibold shadow-xs transition"
      title="Abrir Guia Oficial de Movimentação em formato de impressão A4"
    >
      <Printer className="w-3.5 h-3.5 text-blue-600" />
      <span>Imprimir Guia Oficial (GTM)</span>
    </Link>
  );
}
