import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Barcode,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Package,
  Search,
  Filter,
} from 'lucide-react';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';
import { StatusTransferencia, Prisma } from '@prisma/client';

interface TransferenciasPageProps {
  searchParams?: {
    status?: string;
    q?: string;
  };
}

export default async function TransferenciasPage({
  searchParams,
}: TransferenciasPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const pendencias = await listarPendenciasDoUsuario(user);
  const statusParam = searchParams?.status as StatusTransferencia | undefined;
  const q = searchParams?.q?.trim() || '';

  const whereClause: Prisma.TransferenciaWhereInput = {};

  if (statusParam && Object.values(StatusTransferencia).includes(statusParam)) {
    whereClause.status = statusParam;
  }

  if (q) {
    whereClause.OR = [
      { codigoProtocolo: { contains: q, mode: 'insensitive' } },
      {
        bem: {
          OR: [
            { codigoPatrimonio: { contains: q, mode: 'insensitive' } },
            { descricao: { contains: q, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const transferencias = await prisma.transferencia.findMany({
    where: whereClause,
    include: {
      bem: true,
      unidadeOrigem: true,
      unidadeDestino: true,
      solicitante: { select: { nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'AGUARDANDO_PATRIMONIO':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'AGUARDANDO_ORIGEM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'AGUARDANDO_DESTINO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AGUARDANDO_LOGISTICA':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'EM_TRANSITO':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CONCLUIDA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REPROVADA':
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const statusFiltros: { label: string; valor?: StatusTransferencia }[] = [
    { label: 'Todas' },
    { label: 'DFAS (Patrimônio)', valor: 'AGUARDANDO_PATRIMONIO' },
    { label: 'Aguardando Origem', valor: 'AGUARDANDO_ORIGEM' },
    { label: 'Aguardando Destino', valor: 'AGUARDANDO_DESTINO' },
    { label: 'Aguardando DFAL', valor: 'AGUARDANDO_LOGISTICA' },
    { label: 'Em Trânsito', valor: 'EM_TRANSITO' },
    { label: 'Concluídas', valor: 'CONCLUIDA' },
    { label: 'Reprovadas', valor: 'REPROVADA' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Central de Transferências Patrimoniais
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Consulte, filtre e acompanhe todas as movimentações registradas no SIMPI
            </p>
          </div>

          <Link
            href="/transferencias/nova"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition self-start sm:self-auto"
          >
            <span>+ Nova Transferência</span>
          </Link>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <form method="GET" className="flex items-center gap-2">
            {statusParam && (
              <input type="hidden" name="status" value={statusParam} />
            )}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por protocolo (ex: TRF-2026-0001), código do patrimônio ou descrição..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition"
            >
              Buscar
            </button>
            {q && (
              <Link
                href={statusParam ? `/transferencias?status=${statusParam}` : '/transferencias'}
                className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                Limpar
              </Link>
            )}
          </form>

          {/* Filtros em Pílulas */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {statusFiltros.map((f) => {
              const isSelected = (!statusParam && !f.valor) || statusParam === f.valor;
              const href = f.valor
                ? `/transferencias?status=${f.valor}${q ? `&q=${q}` : ''}`
                : `/transferencias${q ? `?q=${q}` : ''}`;

              return (
                <Link
                  key={f.label}
                  href={href}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Lista de Transferências */}
        {transferencias.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Nenhuma transferência encontrada com os filtros selecionados.
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tente redefinir a busca ou limpar os filtros de status.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
              {transferencias.length} {transferencias.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </div>

            {transferencias.map((trf) => (
              <div
                key={trf.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {trf.codigoProtocolo}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                        trf.status
                      )}`}
                    >
                      {trf.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Solicitado por {trf.solicitante.nome}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    [{trf.bem.codigoPatrimonio}] {trf.bem.descricao}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      De: {trf.unidadeOrigem.nome} ({trf.localizacaoOrigem})
                    </span>
                    <span>➔</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      Para: {trf.unidadeDestino.nome} ({trf.localizacaoDestino})
                    </span>
                  </div>
                </div>

                <Link
                  href={`/transferencias/${trf.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-blue-600 hover:text-white transition border border-slate-200 shrink-0 shadow-xs"
                >
                  <span>Ver Detalhes e Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
