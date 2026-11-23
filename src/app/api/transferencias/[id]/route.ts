import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buscarTransferenciaPorId } from '@/lib/services/transferenciaService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const transferencia = await buscarTransferenciaPorId(id);

    if (!transferencia) {
      return NextResponse.json(
        { error: 'Transferência não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transferencia });
  } catch (error: any) {
    console.error('Erro ao buscar transferência:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar transferência' },
      { status: 500 }
    );
  }
}
