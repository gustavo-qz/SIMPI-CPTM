import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  enviarParaPatrimonio,
  validarPatrimonio,
  aprovarOrigem,
  aprovarDestino,
  confirmarRetirada,
  confirmarEntrega,
  reprovarTransferencia,
  cancelarTransferencia,
  ExecutarAcaoInput,
} from '@/lib/services/transferenciaService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as ExecutarAcaoInput;
    const { acao, motivoOuObservacao } = body;

    let resultado;

    switch (acao) {
      case 'ENVIAR_PATRIMONIO':
        resultado = await enviarParaPatrimonio(id, user);
        break;

      case 'VALIDAR_PATRIMONIO':
        resultado = await validarPatrimonio(id, user, motivoOuObservacao);
        break;

      case 'APROVAR_ORIGEM':
        resultado = await aprovarOrigem(id, user, motivoOuObservacao);
        break;

      case 'APROVAR_DESTINO':
        resultado = await aprovarDestino(id, user, motivoOuObservacao);
        break;

      case 'CONFIRMAR_RETIRADA':
        resultado = await confirmarRetirada(id, user, motivoOuObservacao);
        break;

      case 'CONFIRMAR_ENTREGA':
        resultado = await confirmarEntrega(id, user, motivoOuObservacao);
        break;

      case 'REPROVAR':
        if (!motivoOuObservacao) {
          return NextResponse.json(
            { error: 'O motivo da reprovação é obrigatório.' },
            { status: 400 }
          );
        }
        resultado = await reprovarTransferencia(id, user, motivoOuObservacao);
        break;

      case 'CANCELAR':
        if (!motivoOuObservacao) {
          return NextResponse.json(
            { error: 'O motivo do cancelamento é obrigatório.' },
            { status: 400 }
          );
        }
        resultado = await cancelarTransferencia(id, user, motivoOuObservacao);
        break;

      default:
        return NextResponse.json(
          { error: `Ação inválida ou não suportada: ${acao}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      transferencia: resultado,
      message: `Ação ${acao} executada com sucesso.`,
    });
  } catch (error: any) {
    console.error('Erro ao executar ação de transferência:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar a ação solicitada.' },
      { status: 400 }
    );
  }
}
