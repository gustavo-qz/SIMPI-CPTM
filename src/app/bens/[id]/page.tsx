import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  ArrowLeft,
  Barcode,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Package,
  PlusCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

interface BemDetalhePageProps {
  params: {
    id: string;
  };
}

export default async function BemDetalhePage({ params }: BemDetalhePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = params;

  const bem = await prisma.bemPatrimonial.findUnique({
    where: { id },
    include: {
      unidadeAtual: true,
      transferencias: {
        include: {
          unidadeOrigem: true,
          unidadeDestino: true,
          solicitante: { select: { nome: true } },
          historicos: {
            orderBy: { ocorridoEm: 'desc' },
            take: 1,
          },
        },
        orderBy: { criadoEm: 'desc' },
      },
    },
  });

  if (!bem) {
    notFound();
  }

  const pendencias = await listarPendenciasDoUsuario(user);

  const transferenciaAtiva = bem.transferencias.find(
    (t) => !['CONCLUIDA', 'REPROVADA', 'CANCELADA'].includes(t.status)
  );
  const estaDisponivel = bem.statusBem === 'ATIVO' && !transferenciaAtiva;

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REPROVADA':
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/bens"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Catálogo de Bens</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                  {bem.codigoPatrimonio}
                </span>
                {estaDisponivel ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    DISPONÍVEL PARA MOVIMENTAÇÃO
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    EM MOVIMENTAÇÃO ({transferenciaAtiva?.status || bem.statusBem})
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 pt-1">{bem.descricao}</h1>
              {bem.numeroSerie && (
                <p className="text-xs text-slate-400 font-mono">
                  Número de Série: {bem.numeroSerie}
                </p>
              )}
            </div>

            <div className="shrink-0">
              {estaDisponivel ? (
                <Link
                  href={`/transferencias/nova?bemId=${bem.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Solicitar Transferência</span>
                </Link>
              ) : (
                <Link
                  href={`/transferencias/${transferenciaAtiva?.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>Ver Protocolo Ativo ({transferenciaAtiva?.codigoProtocolo})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Lotação Atual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lotação Física Atual do Bem
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Unidade Atual
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                {bem.unidadeAtual.nome} {bem.unidadeAtual.sigla ? `(${bem.unidadeAtual.sigla})` : ''}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Código da Unidade: {bem.unidadeAtual.codigo}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Localização / Sala Atual
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                {bem.localizacaoAtual}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Atualizado em: {formatarData(bem.atualizadoEm)}
              </span>
            </div>
          </div>
        </div>

        {/* Rastreabilidade Histórica Contínua */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Rastreabilidade Contínua de Movimentações
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Registro de todas as transferências realizadas ao longo do ciclo de vida deste bem
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              {bem.transferencias.length} {bem.transferencias.length === 1 ? 'movimentação' : 'movimentações'}
            </span>
          </div>

          {bem.transferencias.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Este bem permanece em sua lotação cadastral de origem.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Nenhuma transferência anterior foi registrada para este patrimônio.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bem.transferencias.map((trf) => (
                <div
                  key={trf.id}
                  className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatarData(trf.criadoEm)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        De: <strong>{trf.unidadeOrigem.nome}</strong> ({trf.localizacaoOrigem})
                      </span>
                      <span>➔</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        Para: <strong>{trf.unidadeDestino.nome}</strong> ({trf.localizacaoDestino})
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 italic">
                      &quot;{trf.justificativa}&quot;
                    </p>
                  </div>

                  <Link
                    href={`/transferencias/${trf.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-blue-600 hover:text-white text-slate-700 transition border border-slate-200 shrink-0 shadow-xs"
                  >
                    <span>Ver Timeline Completa</span>
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
