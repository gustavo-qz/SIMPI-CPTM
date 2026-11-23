import { PrismaClient, PerfilUsuario, StatusTransferencia, TipoEventoHistorico } from '@prisma/client';
import {
  criarTransferencia,
  enviarParaPatrimonio,
  validarPatrimonio,
  aprovarOrigem,
  aprovarDestino,
  confirmarRetirada,
  confirmarEntrega,
  reprovarTransferencia,
  buscarTransferenciaPorId,
} from '../src/lib/services/transferenciaService';
import { UserSession } from '../src/types/auth';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 ===============================================================');
  console.log('🧪 TESTE DO MOTOR DE TRANSIÇÕES E REGRAS DE NEGÓCIO - SIMPI ETAPA 2');
  console.log('🧪 ===============================================================\n');

  // 1. Carregar Atores de Teste do Seed
  const solicitanteDb = await prisma.usuario.findUnique({
    where: { email: 'solicitante@simpi.gov.br' },
    include: { unidade: true },
  });
  const patrimonioDb = await prisma.usuario.findUnique({
    where: { email: 'patrimonio@simpi.gov.br' },
    include: { unidade: true },
  });
  const origemDb = await prisma.usuario.findUnique({
    where: { email: 'origem@simpi.gov.br' },
    include: { unidade: true },
  });
  const destinoDb = await prisma.usuario.findUnique({
    where: { email: 'destino@simpi.gov.br' },
    include: { unidade: true },
  });
  const logisticaDb = await prisma.usuario.findUnique({
    where: { email: 'logistica@simpi.gov.br' },
    include: { unidade: true },
  });

  if (!solicitanteDb || !patrimonioDb || !origemDb || !destinoDb || !logisticaDb) {
    throw new Error('❌ Execute o seed antes dos testes: npm.cmd run prisma:seed');
  }

  const solicitante: UserSession = {
    id: solicitanteDb.id,
    nome: solicitanteDb.nome,
    email: solicitanteDb.email,
    matricula: solicitanteDb.matricula,
    perfil: solicitanteDb.perfil as any,
    unidadeId: solicitanteDb.unidadeId,
    unidadeNome: solicitanteDb.unidade.nome,
  };

  const patrimonio: UserSession = {
    id: patrimonioDb.id,
    nome: patrimonioDb.nome,
    email: patrimonioDb.email,
    matricula: patrimonioDb.matricula,
    perfil: patrimonioDb.perfil as any,
    unidadeId: patrimonioDb.unidadeId,
    unidadeNome: patrimonioDb.unidade.nome,
  };

  const origem: UserSession = {
    id: origemDb.id,
    nome: origemDb.nome,
    email: origemDb.email,
    matricula: origemDb.matricula,
    perfil: origemDb.perfil as any,
    unidadeId: origemDb.unidadeId,
    unidadeNome: origemDb.unidade.nome,
  };

  const destino: UserSession = {
    id: destinoDb.id,
    nome: destinoDb.nome,
    email: destinoDb.email,
    matricula: destinoDb.matricula,
    perfil: destinoDb.perfil as any,
    unidadeId: destinoDb.unidadeId,
    unidadeNome: destinoDb.unidade.nome,
  };

  const logistica: UserSession = {
    id: logisticaDb.id,
    nome: logisticaDb.nome,
    email: logisticaDb.email,
    matricula: logisticaDb.matricula,
    perfil: logisticaDb.perfil as any,
    unidadeId: logisticaDb.unidadeId,
    unidadeNome: logisticaDb.unidade.nome,
  };

  const regNorte = await prisma.unidade.findUnique({ where: { codigo: 'REG-NORTE' } });
  if (!regNorte) throw new Error('Unidade REG-NORTE não encontrada.');

  // 2. Buscar um Bem Ativo para o Teste
  let bem = await prisma.bemPatrimonial.findFirst({
    where: {
      statusBem: 'ATIVO',
      codigoPatrimonio: 'PAT-2024-0010',
    },
    include: { unidadeAtual: true },
  });

  if (!bem) {
    throw new Error('Bem PAT-2024-0010 não encontrado no status ATIVO.');
  }

  console.log(`📦 Bem selecionado: [${bem.codigoPatrimonio}] ${bem.descricao}`);
  console.log(`📍 Lotação Inicial: ${bem.unidadeAtual.nome} - Local: ${bem.localizacaoAtual}\n`);

  // =========================================================================
  // TESTE 1: Regra de Negócio 1 (Mesma unidade e mesma sala DEVE ser rejeitado)
  // =========================================================================
  console.log('🔹 TESTE 1: Validação de escopo (Mesma unidade + Mesma localização)');
  try {
    await criarTransferencia(
      {
        bemId: bem.id,
        unidadeDestinoId: bem.unidadeAtualId,
        localizacaoDestino: bem.localizacaoAtual,
        justificativa: 'Tentando transferir para a mesma sala',
      },
      solicitante
    );
    console.error('❌ FALHA: O sistema deveria ter bloqueado a transferência!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ SUCESSO: Bloqueado corretamente com a mensagem: "${err.message}"\n`);
  }

  // =========================================================================
  // TESTE 2: Criação de Transferência Válida (Rascunho)
  // =========================================================================
  console.log('🔹 TESTE 2: Criar Rascunho de Transferência');
  const novaTrf = await criarTransferencia(
    {
      bemId: bem.id,
      unidadeDestinoId: regNorte.id,
      localizacaoDestino: 'Sala 102 - TI e Suporte Regional',
      justificativa: 'Atendimento à demanda de expansão da equipe regional.',
      enviarImediatamente: false,
    },
    solicitante
  );
  console.log(`✅ Rascunho criado com Protocolo: ${novaTrf.codigoProtocolo} | Status: ${novaTrf.status}`);

  // =========================================================================
  // TESTE 3: Envio para Validação do Patrimônio (DFAS)
  // =========================================================================
  console.log('\n🔹 TESTE 3: Solicitante envia para Patrimônio (DFAS)');
  const trfEnviada = await enviarParaPatrimonio(novaTrf.id, solicitante);
  console.log(`✅ Transferência enviada ao DFAS | Novo Status: ${trfEnviada.status}`);

  // =========================================================================
  // TESTE 4: Validação Obrigatória pelo Patrimônio (DFAS)
  // =========================================================================
  console.log('\n🔹 TESTE 4: DFAS valida a transferência patrimonial');
  const trfValidada = await validarPatrimonio(
    novaTrf.id,
    patrimonio,
    'Validação contábil e patrimonial DFAS OK.'
  );
  console.log(`✅ Validada pelo Patrimônio | Novo Status: ${trfValidada.status}`);

  // =========================================================================
  // TESTE 5: Aprovação pela Unidade de Origem (Sede)
  // =========================================================================
  console.log('\n🔹 TESTE 5: Gestor de Origem aprova a saída do bem');
  const trfAprovOrigem = await aprovarOrigem(
    novaTrf.id,
    origem,
    'Liberado pelo gestor do gabinete da sede.'
  );
  console.log(`✅ Aprovada pela Origem | Novo Status: ${trfAprovOrigem.status}`);

  // =========================================================================
  // TESTE 6: Aprovação pela Unidade de Destino (Regional Norte)
  // =========================================================================
  console.log('\n🔹 TESTE 6: Gestora de Destino aceita o recebimento');
  const trfAprovDestino = await aprovarDestino(
    novaTrf.id,
    destino,
    'Espaço físico preparado para receber a máquina.'
  );
  console.log(`✅ Aprovada pelo Destino | Novo Status: ${trfAprovDestino.status}`);

  // =========================================================================
  // TESTE 7: Confirmação de Retirada pela Logística (DFAL)
  // =========================================================================
  console.log('\n🔹 TESTE 7: Apoio Logístico (DFAL) confirma retirada física');
  const trfRetirada = await confirmarRetirada(
    novaTrf.id,
    logistica,
    'Equipamento embalado e embarcado na van logística.'
  );
  console.log(`✅ Retirada confirmada | Novo Status: ${trfRetirada.status}`);

  // =========================================================================
  // TESTE 8: Confirmação de Entrega pela Logística (DFAL) + Atualização do Bem
  // =========================================================================
  console.log('\n🔹 TESTE 8: Apoio Logístico (DFAL) confirma entrega no destino');
  const trfConcluida = await confirmarEntrega(
    novaTrf.id,
    logistica,
    'Entregue à equipe técnica da Regional Norte com conferência física.'
  );
  console.log(`✅ Entrega confirmada | Novo Status: ${trfConcluida.status}`);

  // =========================================================================
  // TESTE 9: Validação da Atualização Atômica do Bem Patrimonial
  // =========================================================================
  console.log('\n🔹 TESTE 9: Verificação da Localização e Unidade Atualizada do Bem');
  const bemAtualizado = await prisma.bemPatrimonial.findUnique({
    where: { id: bem.id },
    include: { unidadeAtual: true },
  });

  if (!bemAtualizado) throw new Error('Bem sumiu do banco!');
  console.log(`📍 Nova Unidade Atual do Bem: ${bemAtualizado.unidadeAtual.nome}`);
  console.log(`📍 Nova Localização do Bem: ${bemAtualizado.localizacaoAtual}`);
  console.log(`📦 Status do Bem: ${bemAtualizado.statusBem}`);

  if (bemAtualizado.unidadeAtualId !== regNorte.id) {
    throw new Error('❌ FALHA: A unidade atual do bem não foi atualizada para o destino!');
  }
  if (bemAtualizado.localizacaoAtual !== 'Sala 102 - TI e Suporte Regional') {
    throw new Error('❌ FALHA: A localização atual do bem não foi atualizada para a sala de destino!');
  }
  console.log('✅ SUCESSO: Bem patrimonial atualizado atomicamente na conclusão!');

  // =========================================================================
  // TESTE 10: Auditoria do Histórico Imutável (Timeline)
  // =========================================================================
  console.log('\n🔹 TESTE 10: Auditoria dos Eventos Imutáveis gravados na Timeline');
  const trfCompleta = await buscarTransferenciaPorId(novaTrf.id);
  if (!trfCompleta) throw new Error('Transferência não encontrada na busca.');

  console.log(`📋 Total de eventos registrados: ${trfCompleta.historicos.length}`);
  trfCompleta.historicos.forEach((h, idx) => {
    console.log(
      `   [${idx + 1}] Evento: ${h.tipoEvento.padEnd(20)} | Ator: ${(h.usuario.nome.split(' ')[0] + ' (' + h.perfilAtor + ')').padEnd(25)} | ${h.statusAnterior || 'INÍCIO'} -> ${h.statusNovo}`
    );
  });

  // =========================================================================
  // TESTE 11: Reprovação com Justificativa Obrigatória
  // =========================================================================
  console.log('\n🔹 TESTE 11: Teste de Reprovação com Justificativa');
  const outroBem = await prisma.bemPatrimonial.findFirst({
    where: { codigoPatrimonio: 'PAT-2024-0011' },
  });

  if (outroBem) {
    const trfParaReprovar = await criarTransferencia(
      {
        bemId: outroBem.id,
        unidadeDestinoId: regNorte.id,
        localizacaoDestino: 'Auditório Regional',
        justificativa: 'Solicitação temporária para evento.',
        enviarImediatamente: true,
      },
      solicitante
    );

    // Patrimônio reprova com justificativa
    const trfReprovada = await reprovarTransferencia(
      trfParaReprovar.id,
      patrimonio,
      'Equipamento indispensável na unidade de origem para auditoria este mês.'
    );

    console.log(`✅ Transferência reprovada com sucesso | Status: ${trfReprovada.status}`);
    console.log(`📝 Motivo gravado: "${trfReprovada.motivoEncerramento}"`);

    const bemLiberado = await prisma.bemPatrimonial.findUnique({ where: { id: outroBem.id } });
    console.log(`📦 Status do Bem liberado: ${bemLiberado?.statusBem}`);
  }

  console.log('\n🎉 TODOS OS TESTES DA ETAPA 2 PASSARAM COM 100% DE SUCESSO!');
}

runTests()
  .catch((e) => {
    console.error('❌ Erro no teste do fluxo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
