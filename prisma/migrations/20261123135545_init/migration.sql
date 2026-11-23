-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('SOLICITANTE', 'PATRIMONIO', 'ORIGEM', 'DESTINO', 'LOGISTICA');

-- CreateEnum
CREATE TYPE "StatusTransferencia" AS ENUM ('RASCUNHO', 'AGUARDANDO_PATRIMONIO', 'AGUARDANDO_ORIGEM', 'AGUARDANDO_DESTINO', 'AGUARDANDO_LOGISTICA', 'EM_TRANSITO', 'CONCLUIDA', 'REPROVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoEventoHistorico" AS ENUM ('CRIADA', 'RASCUNHO_SALVO', 'ENVIADA_PATRIMONIO', 'VALIDADA_PATRIMONIO', 'APROVADA_ORIGEM', 'APROVADA_DESTINO', 'REPROVADA', 'CANCELADA', 'RETIRADA_CONFIRMADA', 'ENTREGA_CONFIRMADA');

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "matricula" TEXT,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemPatrimonial" (
    "id" TEXT NOT NULL,
    "codigoPatrimonio" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "unidadeAtualId" TEXT NOT NULL,
    "localizacaoAtual" TEXT NOT NULL,
    "statusBem" TEXT NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BemPatrimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" TEXT NOT NULL,
    "codigoProtocolo" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "unidadeOrigemId" TEXT NOT NULL,
    "localizacaoOrigem" TEXT NOT NULL,
    "unidadeDestinoId" TEXT NOT NULL,
    "localizacaoDestino" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "motivoEncerramento" TEXT,
    "status" "StatusTransferencia" NOT NULL DEFAULT 'RASCUNHO',
    "validadoPatrimonioEm" TIMESTAMP(3),
    "validadoPatrimonioPorId" TEXT,
    "aprovadoOrigemEm" TIMESTAMP(3),
    "aprovadoOrigemPorId" TEXT,
    "aprovadoDestinoEm" TIMESTAMP(3),
    "aprovadoDestinoPorId" TEXT,
    "retiradaEm" TIMESTAMP(3),
    "retiradaPorId" TEXT,
    "entregaEm" TIMESTAMP(3),
    "entregaPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoTransferencia" (
    "id" TEXT NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "perfilAtor" "PerfilUsuario" NOT NULL,
    "tipoEvento" "TipoEventoHistorico" NOT NULL,
    "statusAnterior" "StatusTransferencia",
    "statusNovo" "StatusTransferencia" NOT NULL,
    "observacao" TEXT,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoTransferencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_codigo_key" ON "Unidade"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_matricula_key" ON "Usuario"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "BemPatrimonial_codigoPatrimonio_key" ON "BemPatrimonial"("codigoPatrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "Transferencia_codigoProtocolo_key" ON "Transferencia"("codigoProtocolo");

-- CreateIndex
CREATE INDEX "HistoricoTransferencia_transferenciaId_idx" ON "HistoricoTransferencia"("transferenciaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemPatrimonial" ADD CONSTRAINT "BemPatrimonial_unidadeAtualId_fkey" FOREIGN KEY ("unidadeAtualId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "BemPatrimonial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_unidadeOrigemId_fkey" FOREIGN KEY ("unidadeOrigemId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_unidadeDestinoId_fkey" FOREIGN KEY ("unidadeDestinoId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_validadoPatrimonioPorId_fkey" FOREIGN KEY ("validadoPatrimonioPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_aprovadoOrigemPorId_fkey" FOREIGN KEY ("aprovadoOrigemPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_aprovadoDestinoPorId_fkey" FOREIGN KEY ("aprovadoDestinoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_retiradaPorId_fkey" FOREIGN KEY ("retiradaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_entregaPorId_fkey" FOREIGN KEY ("entregaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTransferencia" ADD CONSTRAINT "HistoricoTransferencia_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "Transferencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTransferencia" ADD CONSTRAINT "HistoricoTransferencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
