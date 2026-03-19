# Hermes Chat

Aplicação desktop de chat com interface moderna para interação com o Hermes Agent via API.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-1.5+-ffc131.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Funcionalidades

- Interface de chat em tempo real com streaming de respostas
- Suporte a múltiplos modelos (GPT-4, GPT-3.5, etc.)
- Comunicação via API REST/SSE com o Hermes Gateway
- Interface responsiva e moderna (React + Tailwind)
- Aplicação desktop nativa (Tauri/Rust)
- Suporte a tema claro/escuro
- Histórico de conversas

## Pré-requisitos

### Obrigatórios

- **Hermes Agent** instalado e configurado
- **API Server** ativado (`API_SERVER_ENABLED=true` no Hermes)
- **Node.js** 18+ (recomendado: 20 LTS)
- **Rust** 1.70+ (para build do Tauri)
- **npm** ou **pnpm** ou **yarn**

### Verificação

```bash
# Verifique se o Hermes Gateway está rodando
curl http://localhost:5001/health

# Verifique versões
node --version   # v18+
npm --version    # v9+
rustc --version  # 1.70+
cargo --version  # 1.70+
```

## Setup do Projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd hermes-chat
```

### 2. Instale as dependências Node.js

```bash
npm install
# ou
pnpm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

Conteúdo mínimo do `.env`:
```env
VITE_HERMES_API_URL=http://localhost:5001
VITE_HERMES_API_KEY=          # opcional, se o gateway requerer auth
```

### 4. Build do Rust (Tauri)

```bash
cargo build
# ou
npm run tauri build
```

## Como Usar

### Modo Desenvolvimento

1. **Inicie o Hermes Gateway** (em outro terminal):
```bash
hermes gateway
# ou
python -m hermes gateway
```

2. **Inicie o app em modo dev**:
```bash
npm run tauri dev
```

Isso abrirá a janela do app e recarregará automaticamente em mudanças.

### Build de Produção

```bash
# Build para a plataforma atual
npm run tauri build

# O executável estará em:
# - Windows: src-tauri/target/release/hermes-chat.exe
# - macOS: src-tauri/target/release/bundle/macos/Hermes Chat.app
# - Linux: src-tauri/target/release/bundle/deb/*.deb
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia apenas o frontend (Vite) |
| `npm run tauri dev` | Inicia app Tauri em modo desenvolvimento |
| `npm run tauri build` | Build de produção |
| `npm run test` | Executa testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run lint` | Verifica código com ESLint |
| `npm run format` | Formata código com Prettier |

## Configuração

### URL da API

A URL base da API é configurada via variável de ambiente:

```env
VITE_HERMES_API_URL=http://localhost:5001
```

Ou pode ser alterada em tempo de execução (se implementado na UI) nas configurações do app.

### Autenticação (API Key)

Se o Hermes Gateway estiver configurado com `API_SERVER_KEY`:

```env
VITE_HERMES_API_KEY=sua-chave-aqui
```

### Configuração do Hermes Gateway

No arquivo `.env` do Hermes:

```env
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=5001
API_SERVER_KEY=                      # deixe vazio para sem auth
API_CORS_ORIGINS=["*"]               # libera CORS para o app
```

### Configurações Avançadas

Verifique `src-tauri/tauri.conf.json` para configurações do Tauri:
- Tamanho da janela
- Permissões de filesystem
- Atalhos de teclado
- Auto-updater

## Estrutura do Projeto

```
hermes-chat/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/           # Componentes React
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários e clientes
│   ├── stores/              # Estado global (Zustand/Redux)
│   ├── styles/              # CSS/Tailwind
│   └── App.tsx              # Entry point
├── src-tauri/               # Backend Rust (Tauri)
│   ├── src/                 # Código Rust
│   ├── Cargo.toml           # Dependências Rust
│   └── tauri.conf.json      # Configuração Tauri
├── tests/                   # Testes automatizados
│   ├── hermes-client.test.ts
│   ├── components.test.tsx
│   └── e2e/
├── docs/                    # Documentação
│   └── TROUBLESHOOTING.md
├── public/                  # Assets estáticos
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

## Testes

### Testes Unitários/Integração

```bash
# Executar todos os testes
npm run test

# Modo watch (durante desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Testes E2E

```bash
# Instalar browsers do Playwright (primeira vez)
npx playwright install

# Executar testes E2E
npm run test:e2e

# Modo UI (visual)
npx playwright test --ui

# Modo debug
npx playwright test --debug
```

### Estrutura dos Testes

```
tests/
├── hermes-client.test.ts    # Testes do cliente HTTP
├── components.test.tsx      # Testes de componentes React
└── e2e/
    └── app.spec.ts          # Testes end-to-end
```

## Troubleshooting

Veja [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) para problemas comuns e soluções.

### Problemas Rápidos

| Erro | Solução |
|------|---------|
| "Cannot connect to Hermes" | Verifique se `hermes gateway` está rodando |
| "No models available" | Verifique `/v1/models` no navegador |
| Build falha no Rust | `rustup update` e `cargo clean` |
| App não abre | Verifique se a porta 1420 está livre |

## Desenvolvimento

### Convenções de Código

- **TypeScript**: Strict mode ativado
- **ESLint**: Regras recomendadas + React hooks
- **Prettier**: Formatação automática
- **Commits**: Seguir Conventional Commits

### Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Roadmap

- [ ] Suporte a múltiplas conversas
- [ ] Exportar/importar histórico
- [ ] Temas customizáveis
- [ ] Atalhos de teclado configuráveis
- [ ] Plugins/extensões
- [ ] Sincronização cloud

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## Suporte

- Documentação do Hermes: [link-docs-hermes]
- Issues: [link-issues]
- Discord: [link-discord]

---

**Nota**: Este projeto requer o Hermes Agent instalado e configurado para funcionar corretamente.
