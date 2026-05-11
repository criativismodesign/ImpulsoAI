# ImpulsoAI

Plataforma de inteligência artificial para potencializar criatividade e inovação.

## Tecnologias

- **Next.js 15** - Framework React de produção
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilização
- **Supabase** - Backend como serviço (database, auth, storage)
- **Vercel** - Hospedagem e deploy

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Deploy

O projeto está configurado para deploy no Vercel no domínio `thiagodesigncruz.com.br`.

## Estrutura do Projeto

```
├── app/                 # App Router do Next.js
│   ├── globals.css     # Estilos globais
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página inicial
├── lib/                # Bibliotecas e utilitários
│   └── supabase.ts     # Cliente Supabase
├── public/             # Arquivos estáticos
└── ...                 # Arquivos de configuração
```

## Design System

- **Fundo escuro**: `#080C1A`
- **Azul elétrico**: `#00B4D8`
- **Fonte**: Inter
- **Tema**: Modo escuro moderno com gradientes e efeitos glass
