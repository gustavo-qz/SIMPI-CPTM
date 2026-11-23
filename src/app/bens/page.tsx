import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  Package,
  Search,
  Building2,
  MapPin,
  Barcode,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

interface BensPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function BensPage({ searchParams }: BensPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const pendencias = await listarPendenciasDoUsuario(user);
  const q = searchParams?.q?.trim() || '';

  const whereClause: any = {};
  if (q) {
    whereClause.OR = [
      { codigoPatrimonio: { contains: q, mode: 'insensitive' } },
      { descricao: { contains: q, mode: 'insensitive' } },
      { localizacaoAtual: { contains: q, mode: 'insensitive' } },
      { numeroSerie: { contains: q, mode: 'insensitive' } },
      { unidadeAtual: { nome: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const bens = await prisma.bemPatrimonial.findMany({
    where: whereClause,
    include: {
      unidadeAtual: true,
      transferencias: {
        where: {
          status: {
            notIn: ['CONCLUIDA', 'REPROVADA', 'CANCELADA'],
          },
        },
        select: {
          id: true,
          codigoProtocolo: true,
          status: true,
        },
      },
    },
    orderBy: { codigoPatrimonio: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Consulta de Bens Patrimoniais
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Consulte a localização atual de qualquer bem patrimonial e solicite transferências
            </p>
          </div>

          <Link
            href="/transferencias/nova"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition"
          >
            <span>+ Nova Transferência</span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <form method="GET" className="flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por código patrimonial (ex: PAT-2024-0010), descrição, sala ou unidade..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition"
            >
              Filtrar
            </button>
            {q && (
              <Link
                href="/bens"
                className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                Limpar
              </Link>
            )}
          </form>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {bens.length} {bens.length === 1 ? 'bem encontrado' : 'bens encontrados'}
            </span>
          </div>

          {bens.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Nenhum bem patrimonial encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente alterar o termo de busca ou verifique o filtro aplicado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bens.map((bem) => {
                const trfAtiva = bem.transferencias[0];
                const estaDisponivel = bem.statusBem === 'ATIVO' && !trfAtiva;

                return (
                  <div
                    key={bem.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/bens/${bem.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-800 px-2 py-0.5 rounded border border-slate-200 transition"
                          title="Ver Ficha e Histórico do Bem"
                        >
                          <Barcode className="w-3.5 h-3.5 text-slate-500" />
                          {bem.codigoPatrimonio}
                        </Link>

                        {estaDisponivel ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            DISPONÍVEL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            EM TRANSFERÊNCIA ({trfAtiva?.status || bem.statusBem})
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/bens/${bem.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition block"
                      >
                        {bem.descricao}
                      </Link>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {bem.unidadeAtual.nome} ({bem.unidadeAtual.sigla || 'Sede'})
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {bem.localizacaoAtual}
                        </span>
                        {bem.numeroSerie && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            S/N: {bem.numeroSerie}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {estaDisponivel ? (
                        <Link
                          href={`/transferencias/nova?bemId=${bem.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition border border-blue-200"
                        >
                          <span>Solicitar Transferência</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/transferencias/${trfAtiva?.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition border border-amber-200"
                        >
                          <span>Ver Protocolo {trfAtiva?.codigoProtocolo}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
