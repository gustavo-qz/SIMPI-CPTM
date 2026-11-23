'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types/auth';
import {
  CheckCircle2,
  XCircle,
  Truck,
  Send,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  Info,
} from 'lucide-react';

interface Props {
  user: UserSession;
  transferenciaId: string;
  codigoProtocolo: string;
  status: string;
  solicitanteId: string;
}

export default function TransferenciaDetalheActions({
  user,
  transferenciaId,
  codigoProtocolo,
  status,
  solicitanteId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalAcao, setModalAcao] = useState<'REPROVAR' | 'CANCELAR' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const executarAcao = async (acao: string, motivoOuObservacao?: string) => {
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch(`/api/transferencias/${transferenciaId}/acao`, {
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
      setLoading(false);
    }
  };

  // Segregação rígida de permissões: CADA PERFIL SÓ EXECUTA A SUA PRÓPRIA ETAPA
  const podeEnviarRascunho =
    status === 'RASCUNHO' && user.id === solicitanteId;

  const podeValidarDFAS =
    status === 'AGUARDANDO_PATRIMONIO' && user.perfil === 'PATRIMONIO';

  const podeAprovarOrigem =
    status === 'AGUARDANDO_ORIGEM' && user.perfil === 'ORIGEM';

  const podeAprovarDestino =
    status === 'AGUARDANDO_DESTINO' && user.perfil === 'DESTINO';

  const podeRetirarDFAL =
    status === 'AGUARDANDO_LOGISTICA' && user.perfil === 'LOGISTICA';

  const podeEntregarDFAL =
    status === 'EM_TRANSITO' && user.perfil === 'LOGISTICA';

  const podeReprovar =
    (status === 'AGUARDANDO_PATRIMONIO' && user.perfil === 'PATRIMONIO') ||
    (status === 'AGUARDANDO_ORIGEM' && user.perfil === 'ORIGEM') ||
    (status === 'AGUARDANDO_DESTINO' && user.perfil === 'DESTINO');

  const podeCancelar =
    ['RASCUNHO', 'AGUARDANDO_PATRIMONIO', 'AGUARDANDO_ORIGEM', 'AGUARDANDO_DESTINO', 'AGUARDANDO_LOGISTICA'].includes(
      status
    ) && user.id === solicitanteId;

  const temAcaoAtiva =
    podeEnviarRascunho ||
    podeValidarDFAS ||
    podeAprovarOrigem ||
    podeAprovarDestino ||
    podeRetirarDFAL ||
    podeEntregarDFAL ||
    podeCancelar;

  // Informação pedagógica sobre quem é o responsável pela etapa atual
  const getProximoAtorMensagem = () => {
    switch (status) {
      case 'RASCUNHO':
        return {
          perfil: 'SOLICITANTE',
          ator: 'Carlos (Solicitante)',
          texto: 'Aguardando o solicitante finalizar e enviar a movimentação para o DFAS.',
          cor: 'bg-blue-50 border-blue-200 text-blue-800',
        };
      case 'AGUARDANDO_PATRIMONIO':
        return {
          perfil: 'PATRIMONIO',
          ator: 'Ana (DFAS / Patrimônio)',
          texto: 'Aguardando validação patrimonial obrigatória (100%) pelo DFAS.',
          cor: 'bg-purple-50 border-purple-200 text-purple-800',
        };
      case 'AGUARDANDO_ORIGEM':
        return {
          perfil: 'ORIGEM',
          ator: 'Roberto (Gestor Origem)',
          texto: 'Aguardando aprovação de liberação pelo gestor da Unidade de Origem.',
          cor: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      case 'AGUARDANDO_DESTINO':
        return {
          perfil: 'DESTINO',
          ator: 'Mariana (Gestora Destino)',
          texto: 'Aguardando aceite de recebimento pelo gestor da Unidade de Destino.',
          cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      case 'AGUARDANDO_LOGISTICA':
        return {
          perfil: 'LOGISTICA',
          ator: 'Felipe (DFAL / Logística)',
          texto: 'Aguardando confirmação de retirada física pela equipe de Apoio Logístico.',
          cor: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        };
      case 'EM_TRANSITO':
        return {
          perfil: 'LOGISTICA',
          ator: 'Felipe (DFAL / Logística)',
          texto: 'Bem em trânsito. Aguardando confirmação de entrega física no destino.',
          cor: 'bg-orange-50 border-orange-200 text-orange-800',
        };
      case 'CONCLUIDA':
        return {
          perfil: 'CONCLUÍDO',
          ator: 'Finalizado',
          texto: 'Transferência concluída. Bem patrimonial atualizado no destino.',
          cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      default:
        return null;
    }
  };

  const proximo = getProximoAtorMensagem();

  return (
    <div className="space-y-3">
      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Caixa de Ações Ativas (Aparece SOMENTE se o usuário atual for o responsável da etapa) */}
      {temAcaoAtiva ? (
        <div className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                Sua Vez de Agir! Perfil: <strong>{user.perfil}</strong>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Esta transferência está exatamente na sua fila de responsabilidade operacional.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {podeReprovar && (
                <button
                  onClick={() => setModalAcao('REPROVAR')}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition border border-red-200"
                >
                  Reprovar Transferência
                </button>
              )}

              {podeCancelar && (
                <button
                  onClick={() => setModalAcao('CANCELAR')}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancelar Solicitação
                </button>
              )}

              {podeEnviarRascunho && (
                <button
                  onClick={() => executarAcao('ENVIAR_PATRIMONIO')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Enviando...' : 'Enviar para o DFAS'}</span>
                </button>
              )}

              {podeValidarDFAS && (
                <button
                  onClick={() => executarAcao('VALIDAR_PATRIMONIO')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Validando...' : 'Aprovar Validação Patrimonial (DFAS)'}</span>
                </button>
              )}

              {podeAprovarOrigem && (
                <button
                  onClick={() => executarAcao('APROVAR_ORIGEM')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Aprovando...' : 'Aprovar Liberação da Origem'}</span>
                </button>
              )}

              {podeAprovarDestino && (
                <button
                  onClick={() => executarAcao('APROVAR_DESTINO')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Aceitando...' : 'Aceitar Recebimento no Destino'}</span>
                </button>
              )}

              {podeRetirarDFAL && (
                <button
                  onClick={() => executarAcao('CONFIRMAR_RETIRADA')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                >
                  <Truck className="w-4 h-4" />
                  <span>{loading ? 'Registrando...' : 'Confirmar Retirada Física (DFAL)'}</span>
                </button>
              )}

              {podeEntregarDFAL && (
                <button
                  onClick={() => executarAcao('CONFIRMAR_ENTREGA')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Concluindo...' : 'Confirmar Entrega no Destino (DFAL)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Aviso de Segregação: Exibe quem é o responsável pela próxima ação */
        proximo && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${proximo.cor}`}>
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold block">
                  Responsável Atual pela Etapa: {proximo.ator} ({proximo.perfil})
                </span>
                <span className="opacity-90">{proximo.texto}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/60 shrink-0">
              Você está como: {user.perfil}
            </span>
          </div>
        )
      )}

      {/* Modal Reprovar / Cancelar */}
      {modalAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {modalAcao === 'REPROVAR' ? 'Reprovar Transferência' : 'Cancelar Transferência'}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Protocolo: <strong className="font-mono text-slate-800">{codigoProtocolo}</strong>.
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
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => executarAcao(modalAcao, motivo)}
                disabled={!motivo || motivo.trim().length < 5}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirmar {modalAcao === 'REPROVAR' ? 'Reprovação' : 'Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
