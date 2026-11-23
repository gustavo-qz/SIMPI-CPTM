'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types/auth';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  Package,
  Building2,
  MapPin,
  AlertCircle,
  Send,
  Trash2,
} from 'lucide-react';

interface TransferenciaPendencia {
  id: string;
  codigoProtocolo: string;
  status: string;
  justificativa: string;
  criadoEm: string | Date;
  bem: {
    id: string;
    codigoPatrimonio: string;
    descricao: string;
  };
  unidadeOrigem: {
    nome: string;
    sigla: string | null;
  };
  localizacaoOrigem: string;
  unidadeDestino: {
    nome: string;
    sigla: string | null;
  };
  localizacaoDestino: string;
  solicitante: {
    nome: string;
  };
}

interface Props {
  user: UserSession;
  transferencias: TransferenciaPendencia[];
}

export default function PendenciasList({ user, transferencias }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [modalAcao, setModalAcao] = useState<{
    aberto: boolean;
    trfId: string;
    protocolo: string;
    tipo: 'REPROVAR' | 'CANCELAR';
  } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const executarAcao = async (
    trfId: string,
    acao: string,
    motivoOuObservacao?: string
  ) => {
    setLoadingId(trfId);
    setErro(null);

    try {
      const res = await fetch(`/api/transferencias/${trfId}/acao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, motivoOuObservacao }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao executar ação.');
      }

      setModalAcao(null);
      setMotivo('');
      router.refresh();
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmarModal = () => {
    if (!modalAcao) return;
    if (!motivo || motivo.trim().length < 5) {
      setErro('O motivo é obrigatório e deve ter pelo menos 5 caracteres.');
      return;
    }
    executarAcao(modalAcao.trfId, modalAcao.tipo, motivo);
  };

  return (
    <div className="space-y-4">
      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {transferencias.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma pendência na sua fila!
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Você não possui nenhuma transferência aguardando sua validação ou ação no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transferencias.map((trf) => {
            const isLoading = loadingId === trf.id;

            return (
              <div
                key={trf.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {trf.codigoProtocolo}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {trf.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Solicitado por {trf.solicitante.nome}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-1">
                      <Package className="w-4 h-4 text-slate-500" />
                      [{trf.bem.codigoPatrimonio}] {trf.bem.descricao}
                    </h3>
                  </div>

                  <Link
                    href={`/transferencias/${trf.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 self-start lg:self-center"
                  >
                    <span>Ver Timeline e Detalhes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Trajeto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Origem
                    </span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {trf.unidadeOrigem.nome}
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {trf.localizacaoOrigem}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Destino Solicitado
                    </span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {trf.unidadeDestino.nome}
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      {trf.localizacaoDestino}
                    </div>
                  </div>
                </div>

                {/* Justificativa */}
                <div className="text-xs text-slate-600 mb-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  <strong className="text-slate-700">Justificativa: </strong>
                  <span>{trf.justificativa}</span>
                </div>

                {/* Barra de Ações Contextuais */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {/* SOLICITANTE - Rascunho */}
                  {user.perfil === 'SOLICITANTE' && trf.status === 'RASCUNHO' && (
                    <>
                      <button
                        onClick={() =>
                          setModalAcao({
                            aberto: true,
                            trfId: trf.id,
                            protocolo: trf.codigoProtocolo,
                            tipo: 'CANCELAR',
                          })
                        }
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                      >
                        Descartar Rascunho
                      </button>
                      <button
                        onClick={() => executarAcao(trf.id, 'ENVIAR_PATRIMONIO')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Enviando...' : 'Enviar para o DFAS'}</span>
                      </button>
                    </>
                  )}

                  {/* PATRIMONIO - Validação DFAS */}
                  {user.perfil === 'PATRIMONIO' && trf.status === 'AGUARDANDO_PATRIMONIO' && (
                    <>
                      <button
                        onClick={() =>
                          setModalAcao({
                            aberto: true,
                            trfId: trf.id,
                            protocolo: trf.codigoProtocolo,
                            tipo: 'REPROVAR',
                          })
                        }
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition border border-red-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reprovar Validação</span>
                      </button>
                      <button
                        onClick={() => executarAcao(trf.id, 'VALIDAR_PATRIMONIO')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Validando...' : 'Aprovar Validação Patrimonial'}</span>
                      </button>
                    </>
                  )}

                  {/* ORIGEM - Liberação */}
                  {user.perfil === 'ORIGEM' && trf.status === 'AGUARDANDO_ORIGEM' && (
                    <>
                      <button
                        onClick={() =>
                          setModalAcao({
                            aberto: true,
                            trfId: trf.id,
                            protocolo: trf.codigoProtocolo,
                            tipo: 'REPROVAR',
                          })
                        }
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition border border-red-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar Liberação</span>
                      </button>
                      <button
                        onClick={() => executarAcao(trf.id, 'APROVAR_ORIGEM')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Aprovando...' : 'Aprovar Liberação da Origem'}</span>
                      </button>
                    </>
                  )}

                  {/* DESTINO - Aceite */}
                  {user.perfil === 'DESTINO' && trf.status === 'AGUARDANDO_DESTINO' && (
                    <>
                      <button
                        onClick={() =>
                          setModalAcao({
                            aberto: true,
                            trfId: trf.id,
                            protocolo: trf.codigoProtocolo,
                            tipo: 'REPROVAR',
                          })
                        }
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition border border-red-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar Recebimento</span>
                      </button>
                      <button
                        onClick={() => executarAcao(trf.id, 'APROVAR_DESTINO')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Aceitando...' : 'Aceitar Recebimento no Destino'}</span>
                      </button>
                    </>
                  )}

                  {/* LOGISTICA - Retirada */}
                  {user.perfil === 'LOGISTICA' && trf.status === 'AGUARDANDO_LOGISTICA' && (
                    <button
                      onClick={() => executarAcao(trf.id, 'CONFIRMAR_RETIRADA')}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{isLoading ? 'Registrando...' : 'Confirmar Retirada Física (DFAL)'}</span>
                    </button>
                  )}

                  {/* LOGISTICA - Entrega */}
                  {user.perfil === 'LOGISTICA' && trf.status === 'EM_TRANSITO' && (
                    <button
                      onClick={() => executarAcao(trf.id, 'CONFIRMAR_ENTREGA')}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isLoading ? 'Concluindo...' : 'Confirmar Entrega no Destino (DFAL)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Reprovação / Cancelamento */}
      {modalAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {modalAcao.tipo === 'REPROVAR' ? 'Reprovar Transferência' : 'Cancelar Transferência'}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Protocolo: <strong className="font-mono text-slate-800">{modalAcao.protocolo}</strong>.
              É obrigatório informar a justificativa detalhada para auditoria patrimonial.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo / Justificativa (Obrigatório)
              </label>
              <textarea
                rows={3}
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Informe o motivo técnico ou operacional..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAcao(null);
                  setMotivo('');
                  setErro(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmarModal}
                disabled={!motivo || motivo.trim().length < 5}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirmar {modalAcao.tipo === 'REPROVAR' ? 'Reprovação' : 'Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
