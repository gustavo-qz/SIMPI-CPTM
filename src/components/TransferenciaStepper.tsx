import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

interface Props {
  status: string;
}

export default function TransferenciaStepper({ status }: Props) {
  const isReprovada = status === 'REPROVADA';
  const isCancelada = status === 'CANCELADA';

  // 5 Etapas do SIMPI
  const etapas = [
    {
      id: 1,
      titulo: '1. Solicitação',
      responsavel: 'Solicitante',
      isCompleted: status !== 'RASCUNHO',
      isCurrent: status === 'RASCUNHO',
    },
    {
      id: 2,
      titulo: '2. Validação DFAS',
      responsavel: 'Patrimônio',
      isCompleted: ![
        'RASCUNHO',
        'AGUARDANDO_PATRIMONIO',
      ].includes(status),
      isCurrent: status === 'AGUARDANDO_PATRIMONIO',
    },
    {
      id: 3,
      titulo: '3. Liberação Origem',
      responsavel: 'Gestor Origem',
      isCompleted: ![
        'RASCUNHO',
        'AGUARDANDO_PATRIMONIO',
        'AGUARDANDO_ORIGEM',
      ].includes(status),
      isCurrent: status === 'AGUARDANDO_ORIGEM',
    },
    {
      id: 4,
      titulo: '4. Aceite Destino',
      responsavel: 'Gestor Destino',
      isCompleted: ![
        'RASCUNHO',
        'AGUARDANDO_PATRIMONIO',
        'AGUARDANDO_ORIGEM',
        'AGUARDANDO_DESTINO',
      ].includes(status),
      isCurrent: status === 'AGUARDANDO_DESTINO',
    },
    {
      id: 5,
      titulo: '5. Transporte DFAL',
      responsavel: 'Logística',
      isCompleted: status === 'CONCLUIDA',
      isCurrent: ['AGUARDANDO_LOGISTICA', 'EM_TRANSITO'].includes(status),
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Progresso da Movimentação Patrimonial
        </span>
        {isReprovada ? (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> REPROVADA
          </span>
        ) : isCancelada ? (
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> CANCELADA
          </span>
        ) : status === 'CONCLUIDA' ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% CONCLUÍDA
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            Aguardando aprovações sequenciais
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {etapas.map((etapa) => {
          let estiloFundo = 'bg-slate-50 border-slate-200 text-slate-500';
          let icone = <span className="text-xs font-bold">{etapa.id}</span>;

          if (etapa.isCompleted && !isReprovada && !isCancelada) {
            estiloFundo = 'bg-emerald-50 border-emerald-300 text-emerald-800';
            icone = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
          } else if (etapa.isCurrent && !isReprovada && !isCancelada) {
            estiloFundo = 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20';
            icone = <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
          } else if (isReprovada && etapa.isCurrent) {
            estiloFundo = 'bg-red-50 border-red-300 text-red-800';
            icone = <XCircle className="w-4 h-4 text-red-600" />;
          }

          return (
            <div
              key={etapa.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition ${estiloFundo}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">{etapa.titulo}</span>
                {icone}
              </div>
              <div className="text-[11px] opacity-80">
                <span>Ator: {etapa.responsavel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
