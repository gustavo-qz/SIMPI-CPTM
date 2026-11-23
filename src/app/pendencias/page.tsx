import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import PendenciasList from '@/components/PendenciasList';
import { Clock, ShieldCheck, Building2, Truck, UserCheck } from 'lucide-react';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

export default async function PendenciasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const pendencias = await listarPendenciasDoUsuario(user);

  const getDescricaoFila = (perfil: string) => {
    switch (perfil) {
      case 'SOLICITANTE':
        return 'Seus rascunhos de transferência salvos aguardando envio.';
      case 'PATRIMONIO':
        return 'Transferências pendentes de validação técnica pelo DFAS (Regra obrigatória 100%).';
      case 'ORIGEM':
        return `Movimentações aguardando autorização de liberação da sua unidade (${user.unidadeNome || 'Sede'}).`;
      case 'DESTINO':
        return `Movimentações aguardando aceite de recebimento na sua unidade (${user.unidadeNome || 'Destino'}).`;
      case 'LOGISTICA':
        return 'Transferências aprovadas pelo DFAL para confirmação de retirada física e entrega.';
      default:
        return 'Fila de itens pendentes de ação.';
    }
  };

  const getIconeFila = (perfil: string) => {
    switch (perfil) {
      case 'PATRIMONIO':
        return <ShieldCheck className="w-6 h-6 text-purple-600" />;
      case 'ORIGEM':
      case 'DESTINO':
        return <Building2 className="w-6 h-6 text-amber-600" />;
      case 'LOGISTICA':
        return <Truck className="w-6 h-6 text-indigo-600" />;
      default:
        return <Clock className="w-6 h-6 text-blue-600" />;
    }
  };

  const pendenciasFormatadas = pendencias.map((p) => ({
    id: p.id,
    codigoProtocolo: p.codigoProtocolo,
    status: p.status,
    justificativa: p.justificativa,
    criadoEm: p.criadoEm,
    bem: {
      id: p.bem.id,
      codigoPatrimonio: p.bem.codigoPatrimonio,
      descricao: p.bem.descricao,
    },
    unidadeOrigem: {
      nome: p.unidadeOrigem.nome,
      sigla: p.unidadeOrigem.sigla,
    },
    localizacaoOrigem: p.localizacaoOrigem,
    unidadeDestino: {
      nome: p.unidadeDestino.nome,
      sigla: p.unidadeDestino.sigla,
    },
    localizacaoDestino: p.localizacaoDestino,
    solicitante: {
      nome: p.solicitante.nome,
    },
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {getIconeFila(user.perfil)}
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Minhas Pendências
              </h1>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {pendencias.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {getDescricaoFila(user.perfil)}
            </p>
          </div>
        </div>

        <PendenciasList user={user} transferencias={pendenciasFormatadas} />
      </main>
    </div>
  );
}
