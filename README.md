# pedro.tec.br

Portfolio e blog pessoal construídos com Astro. O site é estático, rápido e mantém cada artigo como um arquivo Markdown fácil de editar no Obsidian.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```bash
npm install
npm run dev
```

Abra `http://localhost:4321`. Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Publicar um artigo pelo Obsidian

1. Abra `src/content/blog` como uma pasta do seu vault ou crie um link para ela dentro do vault.
2. Duplique um artigo existente e troque o frontmatter e o conteúdo.
3. Salve o arquivo com um slug legível, por exemplo `meu-novo-artigo.md`.
4. Adicione imagens em `public/images/posts/meu-novo-artigo` e use caminhos como `/images/posts/meu-novo-artigo/diagrama.png`.
5. Rode `npm run dev` para revisar e faça commit/push quando estiver satisfeito.

Frontmatter mínimo:

```yaml
---
title: "Título do artigo"
description: "Resumo curto para Google, cards e LinkedIn."
seoTitle: "Título de busca opcional com até 65 caracteres"
seoDescription: "Descrição de busca opcional com até 165 caracteres."
publishedAt: 2026-08-24
category: "Software Architecture"
tags: ["Astro", "Architecture"]
cover: "/images/posts/meu-novo-artigo/cover.webp"
coverAlt: "Descrição objetiva do que aparece na imagem"
draft: false
---
```

Os artigos continuam disponíveis na raiz do domínio (`/slug-do-artigo/`) para preservar os links e o SEO do WordPress. A listagem fica em `/blog/`.

## WordPress e analytics

- `npm run migrate:wordpress` refaz a importação do conteúdo público do WordPress. Ele substitui os arquivos Markdown existentes com o mesmo slug.
- O Google Analytics usa por padrão a tag atual `GT-5NPZT8FB`. Para trocar sem editar o código, defina `PUBLIC_GOOGLE_TAG_ID` no ambiente de build.
- Em produção, o Analytics só carrega depois de o visitante aceitar a preferência de analytics. A política fica em `/privacy-policy/`.
- Sitemap, RSS, canonical URLs, Open Graph, Twitter Cards e dados estruturados de artigos são gerados automaticamente.

## Events

A seção `/events/` fica desabilitada por padrão e não aparece na navegação ou no sitemap. Para habilitá-la em uma build futura, defina `PUBLIC_ENABLE_EVENTS=true`.

## Deploy

O workflow em `.github/workflows/deploy.yml` publica automaticamente a build estática no GitHub Pages a cada push para `main`. O domínio de produção é `pedro.tec.br`.

## LinkedIn

Cada artigo tem um botão de compartilhamento que abre o LinkedIn com a URL correta. Para publicar uma versão nativa no LinkedIn, use o Markdown como fonte e adapte apenas a introdução; o link canônico deve continuar apontando para o blog.
