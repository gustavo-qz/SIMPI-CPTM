import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { buscarTransferenciaPorId, listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';
import Navbar from '@/components/Navbar';
import TransferenciaDetalheActions from '@/components/TransferenciaDetalheActions';
import TransferenciaStepper from '@/components/TransferenciaStepper';
import BotaoImprimirGuia from '@/components/BotaoImprimirGuia';
import Link from 'next/link';
import {
  ArrowLeft,
  Barcode,
  Package,
  Building2,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  History,
  Calendar,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface TransferenciaDetalhePageProps {
  params: {
    id: string;
  };
}

export default async function TransferenciaDetalhePage({
  params,
}: TransferenciaDetalhePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = params;
  const transferencia = await buscarTransferenciaPorId(id);

  if (!transferencia) {
    notFound();
  }

  const pendencias = await listarPendenciasDoUsuario(user);

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

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case 'SOLICITANTE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PATRIMONIO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ORIGEM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DESTINO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOGISTICA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-extrabold text-blue-700">
                  {transferencia.codigoProtocolo}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadge(
                    transferencia.status
                  )}`}
                >
                  {transferencia.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Criada em {formatarData(transferencia.criadoEm)}</span>
                <span>•</span>
                <span>Solicitada por {transferencia.solicitante.nome}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <BotaoImprimirGuia />
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 self-start sm:self-auto">
                <span className="block font-bold text-slate-700 mb-0.5">Rastreabilidade SIMPI</span>
                <span>Histórico com {transferencia.historicos.length} eventos imutáveis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Visual de Progresso */}
        <TransferenciaStepper status={transferencia.status} />

        {/* Motivo de Encerramento (se reprovada ou cancelada) */}
        {transferencia.motivoEncerramento && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-red-800 font-bold">
              <XCircle className="w-4 h-4" />
              <span>Motivo do Encerramento / Reprovação</span>
            </div>
            <p className="text-red-700 pl-5.5">{transferencia.motivoEncerramento}</p>
          </div>
        )}

        {/* Ações contextuais para o usuário autenticado */}
        <TransferenciaDetalheActions
          user={user}
          transferenciaId={transferencia.id}
          codigoProtocolo={transferencia.codigoProtocolo}
          status={transferencia.status}
          solicitanteId={transferencia.solicitanteId}
        />

        {/* Grid: Dados do Bem + Trajeto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card do Bem */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-100">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Bem Patrimonial
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Código do Patrimônio:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {transferencia.bem.codigoPatrimonio}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Descrição:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {transferencia.bem.descricao}
                </span>
              </div>

              {transferencia.bem.numeroSerie && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Número de Série:</span>
                  <span className="font-mono text-slate-600">{transferencia.bem.numeroSerie}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Status Atual do Bem:</span>
                <span className="font-bold text-slate-700">{transferencia.bem.statusBem}</span>
              </div>
            </div>
          </div>

          {/* Card de Origem e Destino */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Trajeto da Movimentação
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                  Origem
                </span>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {transferencia.unidadeOrigem.nome} ({transferencia.unidadeOrigem.sigla || 'Sede'})
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Sala/Setor: <strong>{transferencia.localizacaoOrigem}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                  Destino
                </span>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  {transferencia.unidadeDestino.nome} ({transferencia.unidadeDestino.sigla || 'Destino'})
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Sala/Setor: <strong>{transferencia.localizacaoDestino}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Justificativa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Justificativa da Solicitação
            </h2>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {transferencia.justificativa}
          </p>
        </div>

        {/* Timeline Cronológica Completa do Histórico */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Timeline do Histórico Imutável (Rastreabilidade)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Ordenação cronológica estrita
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {transferencia.historicos.map((h, index) => {
              const isLast = index === transferencia.historicos.length - 1;
              const isReprovada = h.tipoEvento === 'REPROVADA' || h.tipoEvento === 'CANCELADA';

              return (
                <div key={h.id} className="relative group">
                  {/* Ponto indicador */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                      isReprovada
                        ? 'bg-red-500 text-white'
                        : isLast
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {isReprovada ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : isLast ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    )}
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">
                          {h.tipoEvento}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded border ${getPerfilBadge(
                            h.perfilAtor
                          )}`}
                        >
                          {h.perfilAtor}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatarData(h.ocorridoEm)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{h.usuario.nome}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">
                        {h.statusAnterior ? `${h.statusAnterior} ➔ ` : ''}
                        <strong>{h.statusNovo}</strong>
                      </span>
                    </div>

                    {h.observacao && (
                      <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                        &quot;{h.observacao}&quot;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco de Assinaturas Oficiais (Exclusivo para Impressão / GTM) */}
        <div className="hidden print:block pt-8 space-y-8 mt-12 border-t-2 border-slate-400">
          <div className="text-center space-y-1 mb-8">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">
              Termo de Transferência e Responsabilidade Patrimonial
            </h3>
            <p className="text-xs text-slate-600">
              Atestamos que a movimentação física e a transferência da carga patrimonial foram conferidas e executadas em conformidade com o regulamento do SIMPI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-xs text-slate-800">
            <div className="text-center pt-8 border-t border-slate-400">
              <span className="font-bold block">Unidade Cedente (Origem)</span>
              <span className="text-[11px] text-slate-500 block">{transferencia.unidadeOrigem.nome}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Data: ____/____/2026</span>
            </div>
            <div className="text-center pt-8 border-t border-slate-400">
              <span className="font-bold block">Núcleo de Patrimônio (DFAS)</span>
              <span className="text-[11px] text-slate-500 block">Validação Técnica e Contábil</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Data: ____/____/2026</span>
            </div>
            <div className="text-center pt-8 border-t border-slate-400">
              <span className="font-bold block">Apoio Logístico (DFAL)</span>
              <span className="text-[11px] text-slate-500 block">Transporte e Conferência Física</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Data: ____/____/2026</span>
            </div>
            <div className="text-center pt-8 border-t border-slate-400">
              <span className="font-bold block">Unidade Cessionária (Destino)</span>
              <span className="text-[11px] text-slate-500 block">{transferencia.unidadeDestino.nome}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Data: ____/____/2026</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
