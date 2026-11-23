'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Building2,
  MapPin,
  FileText,
  AlertCircle,
  Save,
  Send,
  ArrowRight,
  Info,
} from 'lucide-react';

interface BemItem {
  id: string;
  codigoPatrimonio: string;
  descricao: string;
  unidadeAtualId: string;
  unidadeAtualNome: string;
  localizacaoAtual: string;
}

interface UnidadeItem {
  id: string;
  codigo: string;
  nome: string;
  sigla: string | null;
}

interface Props {
  bens: BemItem[];
  unidades: UnidadeItem[];
  initialBemId?: string;
}

export default function NovaTransferenciaForm({
  bens,
  unidades,
  initialBemId,
}: Props) {
  const router = useRouter();

  const [bemId, setBemId] = useState(initialBemId || (bens[0]?.id ?? ''));
  const selectedBem = bens.find((b) => b.id === bemId);

  const [unidadeDestinoId, setUnidadeDestinoId] = useState(
    selectedBem ? selectedBem.unidadeAtualId : unidades[0]?.id || ''
  );
  const [localizacaoDestino, setLocalizacaoDestino] = useState('');
  const [justificativa, setJustificativa] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Validação em tempo real da Regra de Negócio 1
  const mesmaUnidade = selectedBem && unidadeDestinoId === selectedBem.unidadeAtualId;
  const mesmaLocalizacao =
    selectedBem &&
    localizacaoDestino.trim().toLowerCase() ===
      selectedBem.localizacaoAtual.trim().toLowerCase();

  const ehMesmaSalaEUnidade = mesmaUnidade && mesmaLocalizacao && localizacaoDestino.trim() !== '';

  const handleSubmit = async (enviarImediatamente: boolean) => {
    setLoading(true);
    setErro(null);

    try {
      if (!bemId) throw new Error('Selecione um bem patrimonial.');
      if (!unidadeDestinoId) throw new Error('Selecione a unidade de destino.');
      if (!localizacaoDestino.trim())
        throw new Error('Informe a sala ou localização de destino.');
      if (!justificativa.trim())
        throw new Error('Informe a justificativa da transferência.');

      if (ehMesmaSalaEUnidade) {
        throw new Error(
          'Regra de Negócio: A unidade e localização de destino não podem ser idênticas à origem. Altere a sala ou a unidade.'
        );
      }

      const res = await fetch('/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bemId,
          unidadeDestinoId,
          localizacaoDestino,
          justificativa,
          enviarImediatamente,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar transferência.');
      }

      // Redireciona para o detalhe da transferência criada
      router.push(`/transferencias/${data.transferencia.id}`);
      router.refresh();
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar transferência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {erro && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Não foi possível prosseguir:</strong>
            <span>{erro}</span>
          </div>
        </div>
      )}

      {/* 1. Seleção do Bem */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            1. Selecione o Bem Patrimonial
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bem Patrimonial Disponível
          </label>
          <select
            value={bemId}
            onChange={(e) => {
              setBemId(e.target.value);
              const novo = bens.find((b) => b.id === e.target.value);
              if (novo) {
                setUnidadeDestinoId(novo.unidadeAtualId);
              }
            }}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
          >
            {bens.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.codigoPatrimonio}] {b.descricao} — ({b.unidadeAtualNome})
              </option>
            ))}
          </select>
        </div>

        {/* Card do Bem e Origem Atual */}
        {selectedBem && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Origem Atual Detectada Automaticamente:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Unidade de Origem:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {selectedBem.unidadeAtualNome}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Localização / Sala Atual:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {selectedBem.localizacaoAtual}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Destino da Movimentação */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            2. Destino da Movimentação
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unidade de Destino
            </label>
            <select
              value={unidadeDestinoId}
              onChange={(e) => setUnidadeDestinoId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} {u.sigla ? `(${u.sigla})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sala / Localização Exata no Destino
            </label>
            <input
              type="text"
              required
              value={localizacaoDestino}
              onChange={(e) => setLocalizacaoDestino(e.target.value)}
              placeholder="Ex: Sala 204 - Setor de Contratos"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Alerta de Validação de Escopo */}
        {ehMesmaSalaEUnidade ? (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Atenção:</strong> A sala de destino é idêntica à de origem. Para movimentação na mesma unidade, informe uma sala/setor diferente.
            </span>
          </div>
        ) : mesmaUnidade && localizacaoDestino.trim() !== '' ? (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              <strong>Movimentação Interna:</strong> Mudança de sala/setor dentro da mesma unidade ({selectedBem?.unidadeAtualNome}).
            </span>
          </div>
        ) : null}
      </div>

      {/* 3. Justificativa */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            3. Justificativa da Movimentação
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo / Finalidade da Transferência
          </label>
          <textarea
            rows={4}
            required
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Descreva detalhadamente a necessidade do remanejamento (ex: reposição de equipamento danificado, atendimento a novo servidor, etc)..."
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={loading || ehMesmaSalaEUnidade}
          onClick={() => handleSubmit(false)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
        >
          <Save className="w-4 h-4" />
          <span>Salvar como Rascunho</span>
        </button>

        <button
          type="button"
          disabled={loading || ehMesmaSalaEUnidade}
          onClick={() => handleSubmit(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Processando...' : 'Enviar para o Patrimônio (DFAS)'}</span>
        </button>
      </div>
    </div>
  );
}
