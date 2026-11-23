import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identificador, senha } = body;

    if (!identificador || !senha) {
      return NextResponse.json(
        { error: 'E-mail/matrícula e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanIdentificador = String(identificador).trim().toLowerCase();

    // Busca usuário por e-mail ou matrícula (case-insensitive para e-mail/matrícula)
    const usuario = await prisma.usuario.findFirst({
      where: {
        AND: [
          { ativo: true },
          {
            OR: [
              { email: { equals: cleanIdentificador, mode: 'insensitive' } },
              { matricula: { equals: identificador.trim() } },
            ],
          },
        ],
      },
      include: {
        unidade: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou usuário inativo.' },
        { status: 401 }
      );
    }

    const senhaValida = await verifyPassword(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou usuário inativo.' },
        { status: 401 }
      );
    }

    // Gerar JWT de Sessão
    const sessionPayload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      matricula: usuario.matricula,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId,
      unidadeNome: usuario.unidade.nome,
      unidadeSigla: usuario.unidade.sigla,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Login realizado com sucesso.',
    });

    // Configurar Cookie HTTP-only
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error: any) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar o login. Verifique os logs do servidor.' },
      { status: 500 }
    );
  }
}
