import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  PlusCircle,
  Package,
  ArrowRight,
  Building2,
  MapPin,
  Barcode,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // 1. Contadores Reais
  const pendencias = await listarPendenciasDoUsuario(user);
  const totalEmTransito = await prisma.transferencia.count({
    where: { status: 'EM_TRANSITO' },
  });
  const totalConcluidas = await prisma.transferencia.count({
    where: { status: 'CONCLUIDA' },
  });
  const totalBensAtivos = await prisma.bemPatrimonial.count({
    where: { statusBem: 'ATIVO' },
  });

  // 2. Transferências Recentes (Últimas 6)
  const transferenciasRecentes = await prisma.transferencia.findMany({
    take: 6,
    orderBy: { atualizadoEm: 'desc' },
    include: {
      bem: true,
      unidadeOrigem: true,
      unidadeDestino: true,
      solicitante: { select: { nome: true } },
    },
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

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Painel de Controle • SIMPI
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Bem-vindo, <strong>{user.nome}</strong> ({user.perfil}) • Lotação:{' '}
              {user.unidadeNome || 'Sede Central'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/bens"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>Consultar Bens</span>
            </Link>

            <Link
              href="/transferencias/nova"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nova Transferência</span>
            </Link>
          </div>
        </div>

        {/* Cards Clicáveis do Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card Pendentes */}
          <Link
            href="/pendencias"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Minhas Pendências
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-amber-600 transition">
                {pendencias.length}
              </p>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                Aguardando sua ação no perfil {user.perfil}
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <Clock className="w-6 h-6" />
            </div>
          </Link>

          {/* Card Em Trânsito (DFAL) */}
          <Link
            href="/transferencias?status=EM_TRANSITO"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-orange-300 transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Em Trânsito (DFAL)
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-orange-600 transition">
                {totalEmTransito}
              </p>
              <span className="text-[11px] text-orange-700 font-medium flex items-center gap-1 mt-1">
                Retirados pela logística / em trânsito
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
          </Link>

          {/* Card Concluídas */}
          <Link
            href="/transferencias?status=CONCLUIDA"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Concluídas
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-emerald-600 transition">
                {totalConcluidas}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                Bens entregues e localização atualizada
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Tabela de Movimentações Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Movimentações Recentes
              </h2>
            </div>
            <Link
              href="/transferencias"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {transferenciasRecentes.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Nenhuma transferência registrada no sistema ainda.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Clique no botão &quot;+ Nova Transferência&quot; acima para iniciar a primeira movimentação.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transferenciasRecentes.map((trf) => (
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
                        {formatarData(trf.criadoEm)} • por {trf.solicitante.nome}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      [{trf.bem.codigoPatrimonio}] {trf.bem.descricao}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        De: {trf.unidadeOrigem.nome} ({trf.localizacaoOrigem})
                      </span>
                      <span>➔</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        Para: {trf.unidadeDestino.nome} ({trf.localizacaoDestino})
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/transferencias/${trf.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white transition border border-slate-200 shrink-0"
                  >
                    <span>Ver Detalhes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
