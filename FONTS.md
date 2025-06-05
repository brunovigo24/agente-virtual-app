# Fontes do Projeto

Este projeto foi configurado com três fontes principais do Google Fonts:

## Fontes Configuradas

### 1. **Plus Jakarta Sans** (Sans-Serif Principal)
- **Classe Tailwind**: `font-sans` (padrão)
- **Variável CSS**: `--font-sans`
- **Uso**: Fonte principal para textos gerais, interface e corpo do texto

### 2. **Lora** (Serif)
- **Classe Tailwind**: `font-serif`
- **Variável CSS**: `--font-serif`
- **Uso**: Ideal para títulos elegantes, citações e textos que precisam de um toque mais sofisticado

### 3. **Roboto Mono** (Monospace)
- **Classe Tailwind**: `font-mono`
- **Variável CSS**: `--font-mono`
- **Uso**: Código, dados técnicos, números e textos que precisam de espaçamento uniforme

## Como Usar

### Em Componentes React/JSX
```jsx

<p className="text-base">Texto normal usando Plus Jakarta Sans</p>

<h1 className="font-serif text-3xl">Título Elegante com Lora</h1>

<code className="font-mono bg-gray-100 px-2 py-1 rounded">
  const code = "exemplo";
</code>
```

### Em CSS/Tailwind
```css

.custom-title {
  font-family: var(--font-serif);
}

.code-block {
  font-family: var(--font-mono);
}
```

## Configuração Técnica

As fontes foram configuradas usando:
- `next/font/google` para otimização automática
- Variáveis CSS para flexibilidade
- Integração completa com Tailwind CSS
- Suporte a dark mode e responsividade

### Fallbacks
Cada fonte tem fallbacks configurados:
- **Sans**: `ui-sans-serif`, `system-ui`
- **Serif**: `ui-serif`, `Georgia`
- **Mono**: `ui-monospace`, `SFMono-Regular`

Isso garante que o projeto funcione mesmo se as fontes do Google não carregarem. 