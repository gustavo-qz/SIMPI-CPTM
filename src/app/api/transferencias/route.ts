import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  criarTransferencia,
  listarTransferencias,
} from '@/lib/services/transferenciaService';
import { StatusTransferencia } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StatusTransferencia | null;
    const unidadeId = searchParams.get('unidadeId') || undefined;
    const termoBusca = searchParams.get('q') || undefined;

    const transferencias = await listarTransferencias({
      status: status || undefined,
      unidadeId,
      termoBusca,
    });

    return NextResponse.json({ transferencias });
  } catch (error: any) {
    console.error('Erro ao listar transferências:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar transferências' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { bemId, unidadeDestinoId, localizacaoDestino, justificativa, enviarImediatamente } = body;

    const novaTransferencia = await criarTransferencia(
      {
        bemId,
        unidadeDestinoId,
        localizacaoDestino,
        justificativa,
        enviarImediatamente: Boolean(enviarImediatamente),
      },
      user
    );

    return NextResponse.json(
      {
        success: true,
        transferencia: novaTransferencia,
        message: 'Transferência registrada com sucesso.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar transferência:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar criação da transferência' },
      { status: 400 }
    );
  }
}
