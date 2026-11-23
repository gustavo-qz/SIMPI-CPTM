import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listarPendenciasDoUsuario } from '@/lib/services/transferenciaService';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const pendencias = await listarPendenciasDoUsuario(user);

    return NextResponse.json({
      total: pendencias.length,
      perfil: user.perfil,
      pendencias,
    });
  } catch (error: any) {
    console.error('Erro ao listar pendências do usuário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar pendências' },
      { status: 500 }
    );
  }
}
