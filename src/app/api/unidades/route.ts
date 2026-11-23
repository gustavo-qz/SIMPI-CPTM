import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const unidades = await prisma.unidade.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ unidades });
  } catch (error: any) {
    console.error('Erro ao listar unidades:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar unidades' },
      { status: 500 }
    );
  }
}
