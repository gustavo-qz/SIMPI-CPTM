import { prisma } from '@/lib/prisma';
import {
  PerfilUsuario,
  StatusTransferencia,
  TipoEventoHistorico,
  Prisma,
} from '@prisma/client';
import { UserSession } from '@/types/auth';

export interface CriarTransferenciaInput {
  bemId: string;
  unidadeDestinoId: string;
  localizacaoDestino: string;
  justificativa: string;
  enviarImediatamente?: boolean;
}

export interface ExecutarAcaoInput {
  acao:
    | 'ENVIAR_PATRIMONIO'
    | 'VALIDAR_PATRIMONIO'
    | 'APROVAR_ORIGEM'
    | 'APROVAR_DESTINO'
    | 'CONFIRMAR_RETIRADA'
    | 'CONFIRMAR_ENTREGA'
    | 'REPROVAR'
    | 'CANCELAR';
  motivoOuObservacao?: string;
}

/**
 * Gera o próximo código de protocolo sequencial anual (Ex: TRF-2026-0001)
 */
export async function gerarCodigoProtocolo(
  tx: Prisma.TransactionClient
): Promise<string> {
  const anoAtual = new Date().getFullYear();
  const prefixo = `TRF-${anoAtual}-`;

  const ultima = await tx.transferencia.findFirst({
    where: {
      codigoProtocolo: {
        startsWith: prefixo,
      },
    },
    orderBy: {
      codigoProtocolo: 'desc',
    },
    select: {
      codigoProtocolo: true,
    },
  });

  let sequencial = 1;
  if (ultima?.codigoProtocolo) {
    const partes = ultima.codigoProtocolo.split('-');
    if (partes.length === 3) {
      const num = parseInt(partes[2], 10);
      if (!isNaN(num)) sequencial = num + 1;
    }
  }

  return `${prefixo}${String(sequencial).padStart(4, '0')}`;
}

/**
 * Validação de Escopo de Movimentação (Regra de Negócio 1):
 * - Pode ser entre unidades diferentes OU na mesma unidade (mudança de sala/setor).
 * - NÃO pode ser exatamente a mesma unidade E a mesma sala/localização.
 */
export function validarEscopoMovimentacao(
  unidadeOrigemId: string,
  localizacaoOrigem: string,
  unidadeDestinoId: string,
  localizacaoDestino: string
) {
  const mesmaUnidade = unidadeOrigemId === unidadeDestinoId;
  const mesmaLocalizacao =
    localizacaoOrigem.trim().toLowerCase() ===
    localizacaoDestino.trim().toLowerCase();

  if (mesmaUnidade && mesmaLocalizacao) {
    throw new Error(
      'Movimentação inválida: A unidade e localização de destino não podem ser idênticas às de origem. É necessário alterar a sala/setor ou a unidade.'
    );
  }
}

/**
 * Criação de Transferência (Rascunho ou Envio Direto ao Patrimônio)
 */
export async function criarTransferencia(
  input: CriarTransferenciaInput,
  usuario: UserSession
) {
  // 1. Validar preenchimento dos campos obrigatórios
  if (!input.bemId) throw new Error('O bem patrimonial deve ser informado.');
  if (!input.unidadeDestinoId)
    throw new Error('A unidade de destino é obrigatória.');
  if (!input.localizacaoDestino?.trim())
    throw new Error('A localização de destino é obrigatória.');
  if (!input.justificativa?.trim())
    throw new Error('A justificativa da transferência é obrigatória.');

  return await prisma.$transaction(async (tx) => {
    // 2. Buscar o bem e garantir que existe e está apto
    const bem = await tx.bemPatrimonial.findUnique({
      where: { id: input.bemId },
      include: { unidadeAtual: true },
    });

    if (!bem) {
      throw new Error('Bem patrimonial não encontrado.');
    }

    // Verificar se já existe transferência ativa para esse bem
    const transferenciaAtiva = await tx.transferencia.findFirst({
      where: {
        bemId: bem.id,
        status: {
          notIn: [
            StatusTransferencia.CONCLUIDA,
            StatusTransferencia.REPROVADA,
            StatusTransferencia.CANCELADA,
          ],
        },
      },
      select: { codigoProtocolo: true, status: true },
    });

    if (transferenciaAtiva) {
      throw new Error(
        `O bem ${bem.codigoPatrimonio} já possui uma movimentação em andamento (Protocolo: ${transferenciaAtiva.codigoProtocolo}, Status: ${transferenciaAtiva.status}).`
      );
    }

    // 3. Validar escopo de movimentação com os dados reais do bem no banco
    validarEscopoMovimentacao(
      bem.unidadeAtualId,
      bem.localizacaoAtual,
      input.unidadeDestinoId,
      input.localizacaoDestino
    );

    // 4. Gerar número de protocolo
    const codigoProtocolo = await gerarCodigoProtocolo(tx);

    const statusInicial = input.enviarImediatamente
      ? StatusTransferencia.AGUARDANDO_PATRIMONIO
      : StatusTransferencia.RASCUNHO;

    // 5. Criar registro da Transferência
    const novaTransferencia = await tx.transferencia.create({
      data: {
        codigoProtocolo,
        bemId: bem.id,
        solicitanteId: usuario.id,
        unidadeOrigemId: bem.unidadeAtualId,
        localizacaoOrigem: bem.localizacaoAtual,
        unidadeDestinoId: input.unidadeDestinoId,
        localizacaoDestino: input.localizacaoDestino.trim(),
        justificativa: input.justificativa.trim(),
        status: statusInicial,
      },
    });

    // 6. Atualizar status do Bem se já enviado
    if (input.enviarImediatamente) {
      await tx.bemPatrimonial.update({
        where: { id: bem.id },
        data: { statusBem: 'EM_TRANSFERENCIA' },
      });
    }

    // 7. Gravar histórico inicial imutável
    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: novaTransferencia.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.CRIADA,
        statusAnterior: null,
        statusNovo: statusInicial,
        observacao: input.enviarImediatamente
          ? 'Transferência criada e submetida diretamente para validação do Patrimônio (DFAS).'
          : 'Rascunho de transferência criado.',
      },
    });

    if (input.enviarImediatamente) {
      await tx.historicoTransferencia.create({
        data: {
          transferenciaId: novaTransferencia.id,
          usuarioId: usuario.id,
          perfilAtor: usuario.perfil as PerfilUsuario,
          tipoEvento: TipoEventoHistorico.ENVIADA_PATRIMONIO,
          statusAnterior: StatusTransferencia.RASCUNHO,
          statusNovo: StatusTransferencia.AGUARDANDO_PATRIMONIO,
          observacao: 'Encaminhado para a fila de validação patrimonial do DFAS.',
        },
      });
    }

    return novaTransferencia;
  });
}

/**
 * Enviar Rascunho para Análise do Patrimônio (DFAS)
 */
export async function enviarParaPatrimonio(
  transferenciaId: string,
  usuario: UserSession
) {
  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
      include: { bem: true },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.RASCUNHO) {
      throw new Error('Apenas transferências em RASCUNHO podem ser enviadas.');
    }
    if (
      trf.solicitanteId !== usuario.id &&
      usuario.perfil !== PerfilUsuario.PATRIMONIO
    ) {
      throw new Error('Apenas o solicitante responsável pode enviar o rascunho.');
    }

    // Atualiza status do bem
    await tx.bemPatrimonial.update({
      where: { id: trf.bemId },
      data: { statusBem: 'EM_TRANSFERENCIA' },
    });

    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: { status: StatusTransferencia.AGUARDANDO_PATRIMONIO },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.ENVIADA_PATRIMONIO,
        statusAnterior: StatusTransferencia.RASCUNHO,
        statusNovo: StatusTransferencia.AGUARDANDO_PATRIMONIO,
        observacao: 'Rascunho finalizado e submetido para validação do DFAS.',
      },
    });

    return atualizada;
  });
}

/**
 * Validação do Patrimônio (DFAS - 100% Obrigatória)
 * AGUARDANDO_PATRIMONIO -> AGUARDANDO_ORIGEM
 */
export async function validarPatrimonio(
  transferenciaId: string,
  usuario: UserSession,
  observacao?: string
) {
  if (usuario.perfil !== PerfilUsuario.PATRIMONIO) {
    throw new Error(
      'Apenas membros do Núcleo de Patrimônio (DFAS) podem validar transferências.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.AGUARDANDO_PATRIMONIO) {
      throw new Error(
        'A transferência não está no status AGUARDANDO_PATRIMONIO.'
      );
    }

    const agora = new Date();
    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.AGUARDANDO_ORIGEM,
        validadoPatrimonioEm: agora,
        validadoPatrimonioPorId: usuario.id,
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.VALIDADA_PATRIMONIO,
        statusAnterior: StatusTransferencia.AGUARDANDO_PATRIMONIO,
        statusNovo: StatusTransferencia.AGUARDANDO_ORIGEM,
        observacao:
          observacao?.trim() ||
          'Validação patrimonial efetuada com sucesso pelo DFAS.',
      },
    });

    return atualizada;
  });
}

/**
 * Aprovação da Unidade de Origem (Obrigatória)
 * AGUARDANDO_ORIGEM -> AGUARDANDO_DESTINO
 */
export async function aprovarOrigem(
  transferenciaId: string,
  usuario: UserSession,
  observacao?: string
) {
  if (usuario.perfil !== PerfilUsuario.ORIGEM) {
    throw new Error(
      'Apenas o Gestor da Unidade de Origem (perfil ORIGEM) pode autorizar a liberação do bem.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.AGUARDANDO_ORIGEM) {
      throw new Error('A transferência não está aguardando aprovação da origem.');
    }

    const agora = new Date();
    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.AGUARDANDO_DESTINO,
        aprovadoOrigemEm: agora,
        aprovadoOrigemPorId: usuario.id,
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.APROVADA_ORIGEM,
        statusAnterior: StatusTransferencia.AGUARDANDO_ORIGEM,
        statusNovo: StatusTransferencia.AGUARDANDO_DESTINO,
        observacao:
          observacao?.trim() ||
          'Liberação do bem aprovada pelo responsável da unidade de origem.',
      },
    });

    return atualizada;
  });
}

/**
 * Aprovação da Unidade de Destino (Obrigatória)
 * AGUARDANDO_DESTINO -> AGUARDANDO_LOGISTICA
 */
export async function aprovarDestino(
  transferenciaId: string,
  usuario: UserSession,
  observacao?: string
) {
  if (usuario.perfil !== PerfilUsuario.DESTINO) {
    throw new Error(
      'Apenas o Gestor da Unidade de Destino (perfil DESTINO) pode aceitar o recebimento do bem.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.AGUARDANDO_DESTINO) {
      throw new Error(
        'A transferência não está aguardando aprovação do destino.'
      );
    }

    const agora = new Date();
    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.AGUARDANDO_LOGISTICA,
        aprovadoDestinoEm: agora,
        aprovadoDestinoPorId: usuario.id,
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.APROVADA_DESTINO,
        statusAnterior: StatusTransferencia.AGUARDANDO_DESTINO,
        statusNovo: StatusTransferencia.AGUARDANDO_LOGISTICA,
        observacao:
          observacao?.trim() ||
          'Recebimento do bem aceito pelo responsável da unidade de destino.',
      },
    });

    return atualizada;
  });
}

/**
 * Confirmação de Retirada pela Logística (DFAL)
 * AGUARDANDO_LOGISTICA -> EM_TRANSITO
 */
export async function confirmarRetirada(
  transferenciaId: string,
  usuario: UserSession,
  observacao?: string
) {
  if (usuario.perfil !== PerfilUsuario.LOGISTICA) {
    throw new Error(
      'Apenas o Apoio Logístico (DFAL / perfil LOGISTICA) pode confirmar a retirada física do bem.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.AGUARDANDO_LOGISTICA) {
      throw new Error(
        'A transferência não está pronta para retirada logística.'
      );
    }

    const agora = new Date();
    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.EM_TRANSITO,
        retiradaEm: agora,
        retiradaPorId: usuario.id,
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.RETIRADA_CONFIRMADA,
        statusAnterior: StatusTransferencia.AGUARDANDO_LOGISTICA,
        statusNovo: StatusTransferencia.EM_TRANSITO,
        observacao:
          observacao?.trim() ||
          'Bem retirado fisicamente na origem pela equipe de Logística (DFAL).',
      },
    });

    return atualizada;
  });
}

/**
 * Confirmação de Entrega pela Logística (DFAL)
 * EM_TRANSITO -> CONCLUIDA
 * REGRA CRÍTICA: Atualiza atomicamente a unidadeAtualId e localizacaoAtual do BemPatrimonial!
 */
export async function confirmarEntrega(
  transferenciaId: string,
  usuario: UserSession,
  observacao?: string
) {
  if (usuario.perfil !== PerfilUsuario.LOGISTICA) {
    throw new Error(
      'Apenas o Apoio Logístico (DFAL / perfil LOGISTICA) pode confirmar a entrega física do bem no destino.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
      include: { bem: true },
    });

    if (!trf) throw new Error('Transferência não encontrada.');
    if (trf.status !== StatusTransferencia.EM_TRANSITO) {
      throw new Error('A transferência não está com status EM_TRANSITO.');
    }

    const agora = new Date();

    // 1. ATUALIZAÇÃO ATÔMICA DO BEM PATRIMONIAL NO DESTINO
    await tx.bemPatrimonial.update({
      where: { id: trf.bemId },
      data: {
        unidadeAtualId: trf.unidadeDestinoId,
        localizacaoAtual: trf.localizacaoDestino,
        statusBem: 'ATIVO',
      },
    });

    // 2. CONCLUI A TRANSFERÊNCIA
    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.CONCLUIDA,
        entregaEm: agora,
        entregaPorId: usuario.id,
      },
    });

    // 3. GRAVA HISTÓRICO DE ENTREGA
    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.ENTREGA_CONFIRMADA,
        statusAnterior: StatusTransferencia.EM_TRANSITO,
        statusNovo: StatusTransferencia.CONCLUIDA,
        observacao:
          observacao?.trim() ||
          `Bem entregue com sucesso no destino (${trf.localizacaoDestino}). Localização patrimonial atualizada.`,
      },
    });

    return atualizada;
  });
}

/**
 * Reprovação de Transferência (Exige motivo obrigatório)
 * Permite reprovar nas etapas: AGUARDANDO_PATRIMONIO, AGUARDANDO_ORIGEM, AGUARDANDO_DESTINO
 */
export async function reprovarTransferencia(
  transferenciaId: string,
  usuario: UserSession,
  motivo: string
) {
  if (!motivo || motivo.trim().length < 5) {
    throw new Error(
      'O motivo da reprovação é obrigatório e deve conter pelo menos 5 caracteres.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');

    const statusPermitidos: StatusTransferencia[] = [
      StatusTransferencia.AGUARDANDO_PATRIMONIO,
      StatusTransferencia.AGUARDANDO_ORIGEM,
      StatusTransferencia.AGUARDANDO_DESTINO,
    ];

    if (!statusPermitidos.includes(trf.status)) {
      throw new Error(
        `A transferência no status atual (${trf.status}) não pode ser reprovada.`
      );
    }

    // Libera o bem patrimonial
    await tx.bemPatrimonial.update({
      where: { id: trf.bemId },
      data: { statusBem: 'ATIVO' },
    });

    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.REPROVADA,
        motivoEncerramento: motivo.trim(),
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.REPROVADA,
        statusAnterior: trf.status,
        statusNovo: StatusTransferencia.REPROVADA,
        observacao: `Transferência reprovada. Motivo: ${motivo.trim()}`,
      },
    });

    return atualizada;
  });
}

/**
 * Cancelamento de Transferência (Exige motivo obrigatório)
 * Pode ser cancelado antes de entrar em trânsito
 */
export async function cancelarTransferencia(
  transferenciaId: string,
  usuario: UserSession,
  motivo: string
) {
  if (!motivo || motivo.trim().length < 5) {
    throw new Error(
      'O motivo do cancelamento é obrigatório e deve conter pelo menos 5 caracteres.'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const trf = await tx.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!trf) throw new Error('Transferência não encontrada.');

    const statusBloqueados: StatusTransferencia[] = [
      StatusTransferencia.EM_TRANSITO,
      StatusTransferencia.CONCLUIDA,
      StatusTransferencia.REPROVADA,
      StatusTransferencia.CANCELADA,
    ];

    if (statusBloqueados.includes(trf.status)) {
      throw new Error(
        `Transferências no status ${trf.status} não podem ser canceladas.`
      );
    }

    if (
      trf.solicitanteId !== usuario.id &&
      usuario.perfil !== PerfilUsuario.PATRIMONIO
    ) {
      throw new Error(
        'Apenas o solicitante da transferência ou o DFAS podem cancelá-la.'
      );
    }

    // Libera o bem patrimonial
    await tx.bemPatrimonial.update({
      where: { id: trf.bemId },
      data: { statusBem: 'ATIVO' },
    });

    const atualizada = await tx.transferencia.update({
      where: { id: trf.id },
      data: {
        status: StatusTransferencia.CANCELADA,
        motivoEncerramento: motivo.trim(),
      },
    });

    await tx.historicoTransferencia.create({
      data: {
        transferenciaId: trf.id,
        usuarioId: usuario.id,
        perfilAtor: usuario.perfil as PerfilUsuario,
        tipoEvento: TipoEventoHistorico.CANCELADA,
        statusAnterior: trf.status,
        statusNovo: StatusTransferencia.CANCELADA,
        observacao: `Transferência cancelada. Motivo: ${motivo.trim()}`,
      },
    });

    return atualizada;
  });
}

/**
 * Buscar Transferência Completa com Bem, Unidades, Atores e Histórico Cronológico
 */
export async function buscarTransferenciaPorId(id: string) {
  return await prisma.transferencia.findUnique({
    where: { id },
    include: {
      bem: {
        include: { unidadeAtual: true },
      },
      solicitante: {
        select: { id: true, nome: true, email: true, perfil: true, matricula: true },
      },
      unidadeOrigem: true,
      unidadeDestino: true,
      validadoPatrimonioPor: {
        select: { id: true, nome: true, email: true, matricula: true },
      },
      aprovadoOrigemPor: {
        select: { id: true, nome: true, email: true, matricula: true },
      },
      aprovadoDestinoPor: {
        select: { id: true, nome: true, email: true, matricula: true },
      },
      retiradaPor: {
        select: { id: true, nome: true, email: true, matricula: true },
      },
      entregaPor: {
        select: { id: true, nome: true, email: true, matricula: true },
      },
      historicos: {
        include: {
          usuario: {
            select: { id: true, nome: true, email: true, matricula: true },
          },
        },
        orderBy: { ocorridoEm: 'asc' },
      },
    },
  });
}

/**
 * Listagem de Transferências com filtros opcionais
 */
export async function listarTransferencias(filtros?: {
  status?: StatusTransferencia;
  unidadeId?: string;
  solicitanteId?: string;
  termoBusca?: string;
}) {
  const where: Prisma.TransferenciaWhereInput = {};

  if (filtros?.status) {
    where.status = filtros.status;
  }

  if (filtros?.solicitanteId) {
    where.solicitanteId = filtros.solicitanteId;
  }

  if (filtros?.unidadeId) {
    where.OR = [
      { unidadeOrigemId: filtros.unidadeId },
      { unidadeDestinoId: filtros.unidadeId },
    ];
  }

  if (filtros?.termoBusca) {
    const termo = filtros.termoBusca.trim();
    where.OR = [
      { codigoProtocolo: { contains: termo, mode: 'insensitive' } },
      {
        bem: {
          OR: [
            { codigoPatrimonio: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return await prisma.transferencia.findMany({
    where,
    include: {
      bem: true,
      unidadeOrigem: true,
      unidadeDestino: true,
      solicitante: {
        select: { id: true, nome: true, email: true },
      },
    },
    orderBy: { criadoEm: 'desc' },
  });
}

/**
 * Fila de Pendências Filtrada pelo Perfil e Unidade do Usuário Logado
 */
export async function listarPendenciasDoUsuario(usuario: UserSession) {
  let where: Prisma.TransferenciaWhereInput = {};

  switch (usuario.perfil) {
    case PerfilUsuario.SOLICITANTE:
      // Rascunhos aguardando finalização e envio
      where = {
        solicitanteId: usuario.id,
        status: StatusTransferencia.RASCUNHO,
      };
      break;

    case PerfilUsuario.PATRIMONIO:
      // Fila do DFAS: aguardando validação patrimonial
      where = {
        status: StatusTransferencia.AGUARDANDO_PATRIMONIO,
      };
      break;

    case PerfilUsuario.ORIGEM:
      // Aguardando liberação da origem
      where = {
        status: StatusTransferencia.AGUARDANDO_ORIGEM,
        unidadeOrigemId: usuario.unidadeId,
      };
      break;

    case PerfilUsuario.DESTINO:
      // Aguardando aceite do destino
      where = {
        status: StatusTransferencia.AGUARDANDO_DESTINO,
        unidadeDestinoId: usuario.unidadeId,
      };
      break;

    case PerfilUsuario.LOGISTICA:
      // Fila DFAL: tanto as prontas para retirada quanto as em trânsito prontas para entrega
      where = {
        status: {
          in: [
            StatusTransferencia.AGUARDANDO_LOGISTICA,
            StatusTransferencia.EM_TRANSITO,
          ],
        },
      };
      break;
  }

  return await prisma.transferencia.findMany({
    where,
    include: {
      bem: true,
      unidadeOrigem: true,
      unidadeDestino: true,
      solicitante: {
        select: { id: true, nome: true },
      },
    },
    orderBy: { criadoEm: 'asc' },
  });
}

/**
 * Listagem de Bens Disponíveis para Movimentação
 */
export async function listarBensDisponiveis(termo?: string) {
  const where: Prisma.BemPatrimonialWhereInput = {
    statusBem: 'ATIVO',
  };

  if (termo?.trim()) {
    const q = termo.trim();
    where.OR = [
      { codigoPatrimonio: { contains: q, mode: 'insensitive' } },
      { descricao: { contains: q, mode: 'insensitive' } },
      { localizacaoAtual: { contains: q, mode: 'insensitive' } },
    ];
  }

  return await prisma.bemPatrimonial.findMany({
    where,
    include: {
      unidadeAtual: true,
    },
    orderBy: { codigoPatrimonio: 'asc' },
  });
}
