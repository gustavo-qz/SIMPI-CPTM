import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { buscarTransferenciaPorId } from '@/lib/services/transferenciaService';
import Link from 'next/link';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import BotaoImprimirAcao from './BotaoImprimirAcao';

interface ImprimirGuiaPageProps {
  params: {
    id: string;
  };
}

export default async function ImprimirGuiaPage({
  params,
}: ImprimirGuiaPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = params;
  const trf = await buscarTransferenciaPorId(id);

  if (!trf) {
    notFound();
  }

  const formatarDataHora = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  };

  const formatarDataSimples = (data?: Date | null) => {
    if (!data) return '___/___/______';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(data));
  };

  const ehRemanejamentoInterno = trf.unidadeOrigemId === trf.unidadeDestinoId;

  // Gerador de hash de autenticidade documental
  const hashAutenticidade = `SIMPI-${trf.codigoProtocolo}-${trf.id.slice(-8).toUpperCase()}-VERIFIED`;

  return (
    <div className="min-h-screen bg-slate-200 py-6 sm:py-10 print:py-0 print:bg-white text-slate-900 font-sans">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <div className="max-w-[210mm] mx-auto mb-6 px-4 sm:px-0 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link
          href={`/transferencias/${trf.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar à visualização web</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 hidden md:inline">
            Formato A4 • Use &quot;Salvar como PDF&quot; para download digital
          </span>
          <BotaoImprimirAcao />
        </div>
      </div>

      {/* Folha Oficial A4 */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:p-12 shadow-2xl print:shadow-none print:p-0 print:m-0 border border-slate-300 print:border-none flex flex-col justify-between text-[11px] leading-snug">
        <div>
          {/* Cabeçalho Institucional Oficial */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0 print:border print:border-black">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="font-extrabold uppercase text-[12px] tracking-wider block text-slate-900">
                  REPÚBLICA FEDERATIVA DO BRASIL
                </span>
                <span className="font-bold text-[11px] text-slate-800 block">
                  SIMPI • SISTEMA INTEGRADO DE MOVIMENTAÇÃO PATRIMONIAL E INVENTÁRIO
                </span>
                <span className="text-[10px] text-slate-600 block">
                  DFAS (Núcleo de Patrimônio) • DFAL (Apoio Logístico)
                </span>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-900 pl-4 shrink-0">
              <span className="text-[9px] font-bold uppercase text-slate-500 block">
                Nº DO PROTOCOLO
              </span>
              <span className="font-mono text-base font-black text-slate-900 block tracking-tight">
                {trf.codigoProtocolo}
              </span>
              <span className="text-[9px] font-semibold text-slate-600 block mt-0.5">
                STATUS: <strong>{trf.status}</strong>
              </span>
            </div>
          </div>

          {/* Título da Guia */}
          <div className="text-center my-4 py-1.5 bg-slate-100 border border-slate-300 rounded print:bg-transparent print:border-black">
            <h1 className="text-xs font-black uppercase tracking-wider text-slate-900">
              GUIA DE TRANSFERÊNCIA DE MATERIAL E TERMO DE RESPONSABILIDADE (GTM)
            </h1>
            <span className="text-[10px] text-slate-600">
              Modalidade: {ehRemanejamentoInterno ? 'Remanejamento Interno de Sala' : 'Transferência entre Unidades Distintas'}
            </span>
          </div>

          {/* 1. Identificação do Bem Patrimonial */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white font-bold text-[10px] uppercase px-2 py-1 tracking-wider print:bg-slate-200 print:text-black print:border-t print:border-b print:border-black">
              1. Identificação do Bem Patrimonial
            </div>
            <table className="w-full border-collapse border border-slate-300 print:border-black text-[10px]">
              <tbody>
                <tr className="border-b border-slate-300 print:border-black">
                  <td className="p-2 font-bold w-36 bg-slate-50 print:bg-transparent">
                    Código de Patrimônio (Plaqueta):
                  </td>
                  <td className="p-2 font-mono font-bold text-[11px]">
                    {trf.bem.codigoPatrimonio}
                  </td>
                  <td className="p-2 font-bold w-28 bg-slate-50 print:bg-transparent">
                    Status Contábil:
                  </td>
                  <td className="p-2 font-semibold">{trf.bem.statusBem}</td>
                </tr>
                <tr className="border-b border-slate-300 print:border-black">
                  <td className="p-2 font-bold bg-slate-50 print:bg-transparent">
                    Descrição Detalhada:
                  </td>
                  <td colSpan={3} className="p-2 font-semibold">
                    {trf.bem.descricao}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 print:bg-transparent">
                    Número de Série:
                  </td>
                  <td className="p-2 font-mono">{trf.bem.numeroSerie || 'NÃO APLICÁVEL'}</td>
                  <td className="p-2 font-bold bg-slate-50 print:bg-transparent">
                    Data da Solicitação:
                  </td>
                  <td className="p-2">{formatarDataHora(trf.criadoEm)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Trajeto e Lotação */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white font-bold text-[10px] uppercase px-2 py-1 tracking-wider print:bg-slate-200 print:text-black print:border-t print:border-b print:border-black">
              2. Trajeto da Movimentação Patrimonial
            </div>
            <div className="grid grid-cols-2 border border-slate-300 print:border-black text-[10px]">
              {/* Origem */}
              <div className="p-3 border-r border-slate-300 print:border-black space-y-1">
                <span className="font-bold uppercase text-[9px] text-slate-500 block mb-1">
                  [ UNIDADE CEDENTE / ORIGEM ]
                </span>
                <div>
                  <span className="font-bold">Unidade: </span>
                  <span>{trf.unidadeOrigem.nome} ({trf.unidadeOrigem.sigla || 'Sede'})</span>
                </div>
                <div>
                  <span className="font-bold">Sala / Localização Anterior: </span>
                  <span>{trf.localizacaoOrigem}</span>
                </div>
                <div>
                  <span className="font-bold">Solicitante: </span>
                  <span>{trf.solicitante.nome} {trf.solicitante.matricula ? `(Matrícula: ${trf.solicitante.matricula})` : ''}</span>
                </div>
              </div>

              {/* Destino */}
              <div className="p-3 space-y-1">
                <span className="font-bold uppercase text-[9px] text-slate-500 block mb-1">
                  [ UNIDADE CESSIONÁRIA / DESTINO ]
                </span>
                <div>
                  <span className="font-bold">Unidade: </span>
                  <span>{trf.unidadeDestino.nome} ({trf.unidadeDestino.sigla || 'Destino'})</span>
                </div>
                <div>
                  <span className="font-bold">Sala / Localização Nova: </span>
                  <span>{trf.localizacaoDestino}</span>
                </div>
                <div>
                  <span className="font-bold">Responsável pelo Aceite: </span>
                  <span>{trf.aprovadoDestinoPor?.nome || 'Aguardando formalização'} {trf.aprovadoDestinoPor?.matricula ? `(Matrícula: ${trf.aprovadoDestinoPor.matricula})` : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Justificativa */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white font-bold text-[10px] uppercase px-2 py-1 tracking-wider print:bg-slate-200 print:text-black print:border-t print:border-b print:border-black">
              3. Finalidade e Justificativa Administrativa
            </div>
            <div className="border border-slate-300 print:border-black p-3 text-[10px] bg-slate-50/50 print:bg-transparent">
              <p className="whitespace-pre-line leading-relaxed">{trf.justificativa}</p>
            </div>
          </div>

          {/* 4. Rastreabilidade de Despachos */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white font-bold text-[10px] uppercase px-2 py-1 tracking-wider print:bg-slate-200 print:text-black print:border-t print:border-b print:border-black">
              4. Despachos e Rastreabilidade Eletrônica (Auditoria SIMPI)
            </div>
            <table className="w-full border-collapse border border-slate-300 print:border-black text-[9.5px]">
              <thead>
                <tr className="bg-slate-100 print:bg-transparent border-b border-slate-300 print:border-black">
                  <th className="p-1.5 text-left w-24">Data/Hora</th>
                  <th className="p-1.5 text-left w-36">Servidor / Matrícula</th>
                  <th className="p-1.5 text-left w-24">Perfil</th>
                  <th className="p-1.5 text-left">Ato / Despacho Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {trf.historicos.map((h) => (
                  <tr key={h.id}>
                    <td className="p-1.5 font-mono text-[9px]">{formatarDataHora(h.ocorridoEm)}</td>
                    <td className="p-1.5 font-semibold">
                      {h.usuario.nome}
                      {h.usuario.matricula && (
                        <span className="text-[8.5px] text-slate-500 block font-normal font-mono">
                          Mat: {h.usuario.matricula}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 font-bold uppercase text-[8.5px]">{h.perfilAtor}</td>
                    <td className="p-1.5">
                      <strong className="block">{h.tipoEvento}</strong>
                      {h.observacao && <span className="text-slate-600 italic block">{h.observacao}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Termo de Responsabilidade */}
          <div className="mb-6 p-3 border border-slate-300 print:border-black bg-slate-50/60 print:bg-transparent text-[9.5px] leading-relaxed text-justify">
            <strong className="block uppercase mb-0.5">TERMO DE TRANSFERÊNCIA DE CUSTÓDIA E RESPONSABILIDADE:</strong>
            Pelo presente instrumento, atestamos que a movimentação física e a transferência da carga patrimonial do bem acima descrito foram formalizadas conforme as diretrizes do SIMPI. A Unidade Cessionária (Destino) declara haver recebido o bem nas condições especificadas, assumindo a guarda, conservação e responsabilidade pelo seu uso regular. A Unidade Cedente (Origem) fica desonerada da respectiva carga patrimonial a partir do registro definitivo de entrega.
          </div>

          {/* 6. Quadro de Assinaturas (4 Atores) */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-2">
            {/* Origem */}
            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-[11px] italic">
                {trf.aprovadoOrigemPor?.nome || trf.solicitante.nome}
              </div>
              <span className="font-bold block text-[10px] uppercase">
                1. Unidade Cedente (Origem)
              </span>
              <span className="text-[9px] text-slate-600 block">
                {trf.aprovadoOrigemPor?.nome || trf.solicitante.nome}
                {trf.aprovadoOrigemPor?.matricula ? ` • Matrícula: ${trf.aprovadoOrigemPor.matricula}` : ''}
              </span>
              <span className="text-[8.5px] text-slate-500 block">
                Data: {formatarDataSimples(trf.aprovadoOrigemEm || trf.criadoEm)}
              </span>
            </div>

            {/* DFAS */}
            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-[11px] italic">
                {trf.validadoPatrimonioPor?.nome || (trf.validadoPatrimonioEm ? 'Validação DFAS Registrada' : '')}
              </div>
              <span className="font-bold block text-[10px] uppercase">
                2. Núcleo de Patrimônio (DFAS)
              </span>
              <span className="text-[9px] text-slate-600 block">
                {trf.validadoPatrimonioPor?.nome || 'Validador Patrimonial'}
                {trf.validadoPatrimonioPor?.matricula ? ` • Matrícula: ${trf.validadoPatrimonioPor.matricula}` : ''}
              </span>
              <span className="text-[8.5px] text-slate-500 block">
                Data: {formatarDataSimples(trf.validadoPatrimonioEm)}
              </span>
            </div>

            {/* DFAL */}
            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-[11px] italic">
                {trf.retiradaPor?.nome || trf.entregaPor?.nome || (trf.entregaEm ? 'Transporte Concluído DFAL' : '')}
              </div>
              <span className="font-bold block text-[10px] uppercase">
                3. Apoio Logístico (DFAL)
              </span>
              <span className="text-[9px] text-slate-600 block">
                {trf.entregaPor?.nome || trf.retiradaPor?.nome || 'Operador de Logística'}
                {trf.entregaPor?.matricula ? ` • Matrícula: ${trf.entregaPor.matricula}` : ''}
              </span>
              <span className="text-[8.5px] text-slate-500 block">
                Data de Entrega: {formatarDataSimples(trf.entregaEm)}
              </span>
            </div>

            {/* Destino */}
            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-[11px] italic">
                {trf.aprovadoDestinoPor?.nome || (trf.aprovadoDestinoEm ? 'Aceite no Destino Registrado' : '')}
              </div>
              <span className="font-bold block text-[10px] uppercase">
                4. Unidade Cessionária (Destino)
              </span>
              <span className="text-[9px] text-slate-600 block">
                {trf.aprovadoDestinoPor?.nome || 'Gestor Responsável no Destino'}
                {trf.aprovadoDestinoPor?.matricula ? ` • Matrícula: ${trf.aprovadoDestinoPor.matricula}` : ''}
              </span>
              <span className="text-[8.5px] text-slate-500 block">
                Data de Aceite: {formatarDataSimples(trf.aprovadoDestinoEm)}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé Oficial de Autenticidade */}
        <div className="border-t border-slate-400 pt-3 mt-6 flex items-center justify-between text-[8.5px] text-slate-500">
          <div>
            <span className="font-mono block">Chave de Autenticação: {hashAutenticidade}</span>
            <span>Documento emitido eletronicamente via SIMPI em {formatarDataHora(new Date())}</span>
          </div>
          <div className="text-right">
            <span>Página 1 de 1 • Arquivamento Oficial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
