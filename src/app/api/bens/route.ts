import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listarBensDisponiveis } from '@/lib/services/transferenciaService';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;

    const bens = await listarBensDisponiveis(q);

    return NextResponse.json({
      total: bens.length,
      bens,
    });
  } catch (error: any) {
    console.error('Erro ao listar bens disponíveis:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar bens disponíveis' },
      { status: 500 }
    );
  }
}
