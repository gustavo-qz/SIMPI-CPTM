import { PrismaClient, PerfilUsuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados SIMPI...');

  // 1. Criar Unidades Organizacionais
  const unidadesData = [
    {
      codigo: 'DFAS',
      nome: 'Núcleo de Patrimônio (DFAS)',
      sigla: 'DFAS',
    },
    {
      codigo: 'DFAL',
      nome: 'Apoio Logístico (DFAL)',
      sigla: 'DFAL',
    },
    {
      codigo: 'SEDE-ADM',
      nome: 'Sede Central Administrativa',
      sigla: 'SEDE',
    },
    {
      codigo: 'REG-NORTE',
      nome: 'Unidade Regional Norte',
      sigla: 'URN',
    },
    {
      codigo: 'REG-SUL',
      nome: 'Unidade Regional Sul',
      sigla: 'URS',
    },
  ];

  const unidadesMap = new Map<string, string>();

  for (const u of unidadesData) {
    const record = await prisma.unidade.upsert({
      where: { codigo: u.codigo },
      update: { nome: u.nome, sigla: u.sigla },
      create: u,
    });
    unidadesMap.set(u.codigo, record.id);
  }

  console.log('✅ Unidades cadastradas com sucesso.');

  // 2. Criar Usuários para cada Perfil de teste
  const senhaPadraoHash = await bcrypt.hash('simpi@123', 10);

  const usuariosData = [
    {
      nome: 'Carlos Solicitante (Gabinete Sede)',
      email: 'solicitante@simpi.gov.br',
      matricula: 'MAT-1001',
      senhaHash: senhaPadraoHash,
      perfil: PerfilUsuario.SOLICITANTE,
      unidadeId: unidadesMap.get('SEDE-ADM')!,
    },
    {
      nome: 'Ana Patrimônio (DFAS)',
      email: 'patrimonio@simpi.gov.br',
      matricula: 'MAT-2001',
      senhaHash: senhaPadraoHash,
      perfil: PerfilUsuario.PATRIMONIO,
      unidadeId: unidadesMap.get('DFAS')!,
    },
    {
      nome: 'Roberto Gestor Origem (Sede)',
      email: 'origem@simpi.gov.br',
      matricula: 'MAT-3001',
      senhaHash: senhaPadraoHash,
      perfil: PerfilUsuario.ORIGEM,
      unidadeId: unidadesMap.get('SEDE-ADM')!,
    },
    {
      nome: 'Mariana Gestora Destino (Regional Norte)',
      email: 'destino@simpi.gov.br',
      matricula: 'MAT-4001',
      senhaHash: senhaPadraoHash,
      perfil: PerfilUsuario.DESTINO,
      unidadeId: unidadesMap.get('REG-NORTE')!,
    },
    {
      nome: 'Felipe Logística (DFAL)',
      email: 'logistica@simpi.gov.br',
      matricula: 'MAT-5001',
      senhaHash: senhaPadraoHash,
      perfil: PerfilUsuario.LOGISTICA,
      unidadeId: unidadesMap.get('DFAL')!,
    },
  ];

  for (const user of usuariosData) {
    await prisma.usuario.upsert({
      where: { email: user.email },
      update: {
        nome: user.nome,
        matricula: user.matricula,
        senhaHash: user.senhaHash,
        perfil: user.perfil,
        unidadeId: user.unidadeId,
      },
      create: user,
    });
  }

  console.log('✅ Usuários de teste para todos os perfis criados.');

  // 3. Criar Bens Patrimoniais de Exemplo
  const bensData = [
    {
      codigoPatrimonio: 'PAT-2024-0010',
      descricao: 'Notebook Dell Latitude 5440 Core i7 16GB SSD 512GB',
      numeroSerie: 'BR-DELL-882190',
      unidadeAtualId: unidadesMap.get('SEDE-ADM')!,
      localizacaoAtual: 'Sala 302 - Gabinete da Presidência',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2024-0011',
      descricao: 'Monitor Dell 27 Polegadas 4K UltraSharp U2723QE',
      numeroSerie: 'CN-MON-771239',
      unidadeAtualId: unidadesMap.get('SEDE-ADM')!,
      localizacaoAtual: 'Sala 302 - Gabinete da Presidência',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2023-0854',
      descricao: 'Impressora Multifuncional Laser HP LaserJet Enterprise M528',
      numeroSerie: 'VNB3G88102',
      unidadeAtualId: unidadesMap.get('SEDE-ADM')!,
      localizacaoAtual: 'Corredor Central 3º Andar (Próximo à Copa)',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2024-0155',
      descricao: 'Mesa de Escritório em L Ergonômica com Gaveteiro Volante',
      numeroSerie: 'MOB-2024-554',
      unidadeAtualId: unidadesMap.get('SEDE-ADM')!,
      localizacaoAtual: 'Sala 305 - Diretoria Financeira',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2023-0412',
      descricao: 'Servidor Rack Dell PowerEdge R650 64GB Xeon Silver',
      numeroSerie: 'SRV-DL-99410',
      unidadeAtualId: unidadesMap.get('DFAS')!,
      localizacaoAtual: 'CPD Central - Rack A03',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2024-0320',
      descricao: 'Projetor Multimídia Epson Laser 4500 Lumens WUXGA',
      numeroSerie: 'EPS-LSR-33419',
      unidadeAtualId: unidadesMap.get('REG-NORTE')!,
      localizacaoAtual: 'Auditório Principal - Sala de Reunião 1',
      statusBem: 'ATIVO',
    },
    {
      codigoPatrimonio: 'PAT-2024-0411',
      descricao: 'Workstation HP Z4 G5 Intel Xeon 32GB RTX A4000',
      numeroSerie: 'HP-WS-441092',
      unidadeAtualId: unidadesMap.get('REG-SUL')!,
      localizacaoAtual: 'Sala Técnica de Engenharia e TI',
      statusBem: 'ATIVO',
    },
  ];

  for (const bem of bensData) {
    await prisma.bemPatrimonial.upsert({
      where: { codigoPatrimonio: bem.codigoPatrimonio },
      update: {
        descricao: bem.descricao,
        numeroSerie: bem.numeroSerie,
        unidadeAtualId: bem.unidadeAtualId,
        localizacaoAtual: bem.localizacaoAtual,
        statusBem: bem.statusBem,
      },
      create: bem,
    });
  }

  console.log('✅ Bens patrimoniais cadastrados com sucesso.');
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
