# Agente Virtual

Plataforma inteligente para gerenciamento de atendimento automatizado

## 🤖 Visão Geral

O Agente Virtual é uma plataforma web para gerenciamento de atendimento automatizado, com foco em interações via WhatsApp. O sistema permite:

- Criação e gerenciamento de menus interativos
- Configuração de mensagens automáticas
- Gerenciamento de instâncias do WhatsApp
- Ações personalizadas e automatizadas
- Transferência de atendimento para destinos específicos

## Funcionalidades Principais

## 🔐 Autenticação
O sistema utiliza JWT (JSON Web Tokens) para autenticação:
- Login com usuário e senha
- Armazenamento seguro do token no localStorage
- Validação do token em todas as rotas protegidas

## 🖥️ Funcionalidades Principais

1. **Dashboard Administrativo**
   - Interface moderna com sidebar
   - Animações fluidas

2. **Gerenciamento de Menus**
   - CRUD completo de menus de atendimento
   - Pré-visualização em tempo real
   - Opções personalizáveis

3. **Mensagens Automatizadas**
   - Configuração de respostas padrão
   - Templates de mensagens

4. **Integração com WhatsApp**
   - Gerenciamento de instâncias
   - Configuração de destinos de transferência

5. **Ações Personalizadas**
   - Fluxos automatizados
   - Gatilhos e respostas

## 🛠️ Como baixar e executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- pnpm (gerenciador de pacotes)
- Variáveis de ambiente configuradas

### Instalação
1. Clone o repositório:
   ```bash
   git clone git@github.com:brunovigo24/agente-virtual-app.git
   ```

2. Instale as dependências:
   ```bash
   pnpm install
   ```

## 📦 Scripts Disponíveis
- `pnpm dev`: Inicia o servidor de desenvolvimento
- `pnpm build`: Cria uma versão otimizada para produção
- `pnpm start`: Inicia o servidor de produção
- `pnpm lint`: Executa análise estática do código

---

Desenvolvido por [Bruno Vigo](https://www.linkedin.com/in/bruno-vigo-506026206/).
