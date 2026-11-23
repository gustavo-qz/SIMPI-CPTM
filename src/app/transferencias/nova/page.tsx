import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import NovaTransferenciaForm from '@/components/NovaTransferenciaForm';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

interface NovaTransferenciaPageProps {
  searchParams?: {
    bemId?: string;
  };
}

export default async function NovaTransferenciaPage({
  searchParams,
}: NovaTransferenciaPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const pendencias = await listarPendenciasDoUsuario(user);

  // Busca bens disponíveis (status ATIVO e sem transferência em andamento)
  const bens = await prisma.bemPatrimonial.findMany({
    where: {
      statusBem: 'ATIVO',
      transferencias: {
        none: {
          status: {
            notIn: ['CONCLUIDA', 'REPROVADA', 'CANCELADA'],
          },
        },
      },
    },
    include: { unidadeAtual: true },
    orderBy: { codigoPatrimonio: 'asc' },
  });

  // Busca todas as unidades ativas
  const unidades = await prisma.unidade.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });

  const bensFormatados = bens.map((b) => ({
    id: b.id,
    codigoPatrimonio: b.codigoPatrimonio,
    descricao: b.descricao,
    unidadeAtualId: b.unidadeAtualId,
    unidadeAtualNome: b.unidadeAtual.nome,
    localizacaoAtual: b.localizacaoAtual,
  }));

  const unidadesFormatadas = unidades.map((u) => ({
    id: u.id,
    codigo: u.codigo,
    nome: u.nome,
    sigla: u.sigla,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} totalPendencias={pendencias.length} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/bens"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Consulta de Bens</span>
          </Link>

          <div className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Nova Solicitação de Transferência
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Preencha os dados de remanejamento. O processo passará por validação patrimonial (DFAS), aprovações de origem e destino e transporte logístico (DFAL).
          </p>
        </div>

        {bensFormatados.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Não há bens patrimoniais ativos disponíveis para movimentação no momento.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Todos os bens já possuem movimentação em andamento ou estão baixados.
            </p>
            <Link
              href="/bens"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Consultar Bens
            </Link>
          </div>
        ) : (
          <NovaTransferenciaForm
            bens={bensFormatados}
            unidades={unidadesFormatadas}
            initialBemId={searchParams?.bemId}
          />
        )}
      </main>
    </div>
  );
}
