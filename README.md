# SIMPI - Sistema Integrado de Movimentação Patrimonial e Inventário
> **Sistema Completo: Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL**

---

## 📌 1. Visão Geral da Solução
O **SIMPI** é o sistema institucional de controle e governança para movimentação física e transferência patrimonial contínua ao longo do ano, integrando os núcleos de:
- **DFAS (Núcleo de Patrimônio):** Validação técnica e contábil obrigatória em 100% dos processos.
- **DFAL (Apoio Logístico):** Movimentação física, retirada na origem e entrega no destino com atualização atômica da localização do bem.

---

## 📱 2. Módulos e Telas do Sistema

1. **Autenticação com Segregação Estrita de Funções (`/login`):**
   - Login por e-mail ou matrícula + senha.
   - **Atalhos Rápidos de 1 Clique:** Seletores para alternar instantaneamente entre os 5 atores:
     - `SOLICITANTE` (Carlos - Gabinete Sede)
     - `PATRIMONIO` (Ana - DFAS)
     - `ORIGEM` (Roberto - Sede Central)
     - `DESTINO` (Mariana - Regional Norte)
     - `LOGISTICA` (Felipe - Apoio Logístico DFAL)

2. **Dashboard Operacional (`/dashboard`):**
   - Cards clicáveis com contadores reais de *Minhas Pendências*, *Em Trânsito (DFAL)* e *Concluídas*.
   - Atalhos rápidos para `+ Nova Transferência` e `Consultar Bens`.
   - Tabela de *Movimentações Recentes* com badges e acesso rápido.

3. **Catálogo de Bens Patrimoniais (`/bens`):**
   - Busca instantânea por plaqueta patrimonial, descrição, sala ou unidade.
   - Indicador de disponibilidade (`DISPONÍVEL` vs `EM TRANSFERÊNCIA`).
   - Links diretos para abrir a ficha cadastral do bem ou solicitar transferência imediata.

4. **Ficha do Bem com Rastreabilidade Contínua (`/bens/:id`):**
   - Exibe a lotação cadastral atual do bem (unidade e sala/setor).
   - **Histórico Completo de Transferências:** Linha do tempo de todas as movimentações passadas que o bem sofreu ao longo do ano (de onde veio, para onde foi, quem aprovou e protocolo).

5. **Nova Solicitação de Transferência (`/transferencias/nova`):**
   - Seleção do bem ativo com detecção automática da localização de origem.
   - Definição da unidade e sala de destino (entre unidades diferentes ou mudança de sala dentro da mesma unidade).
   - **Trava de Validação em Tempo Real (Regra 1):** Bloqueio imediato se a mesma unidade e mesma sala forem selecionadas.
   - Opções: *Salvar Rascunho* ou *Enviar para o Patrimônio (DFAS)*.

6. **Fila de Pendências Filtrada por Perfil (`/pendencias`):**
   - Exibe somente os processos que dependem da ação do usuário logado:
     - `DFAS`: Fila de validação patrimonial obrigatória.
     - `Origem`: Fila de liberação da unidade de saída.
     - `Destino`: Fila de aceite da unidade receptora.
     - `Logística`: Fila de retirada e entrega física.
   - Ações diretas e modal de motivo obrigatório para reprovações e cancelamentos.

7. **Detalhe da Transferência com Stepper e Assinaturas (`/transferencias/:id`):**
   - **Stepper Visual de 5 Etapas:** Indicação em tempo real de quem já assinou e qual é o próximo setor responsável.
   - **Timeline Cronológica do Histórico Imutável:** Registro cronológico de cada evento com ator, perfil, status anterior, status novo, data/hora e justificativa.
   - **Botão "Imprimir Guia (GTM)":** Formata a página para impressão oficial em A4 com 4 blocos de assinaturas físicas (Origem, DFAS, DFAL e Destino).

8. **Central de Transferências com Multi-Filtros (`/transferencias`):**
   - Busca textual por código do bem, descrição ou protocolo.
   - Filtros rápidos em pílulas por status (DFAS, Origem, Destino, Logística, Em Trânsito, Concluídas, Reprovadas).

---

## 🚀 3. Como Rodar no VS Code

### Opção A: Usando o Docker Compose (Mais Rápido e Limpo)
Se você possui o Docker Desktop instalado, suba o PostgreSQL com 1 comando:
```powershell
# Na raiz do projeto
docker compose up -d
```

### Opção B: Usando PostgreSQL Local
Verifique o arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simpi_db?schema=public"
JWT_SECRET="simpi-secret-key-jwt-antigravity-2026-secure-token"
PORT=3000
```

### Criar Tabelas e Carregar Dados de Teste:
```powershell
# Cria as tabelas e enums no PostgreSQL
npm.cmd run prisma:migrate -- --name init

# Popula o banco com as unidades, os 5 usuários e os bens
npm.cmd run prisma:seed

# Executa os testes automatizados de regras de negócio
npm.cmd run test:fluxo
```

### Iniciar o Servidor:
```powershell
npm.cmd run dev
```
Acesse no seu navegador: **`http://localhost:3000`**
