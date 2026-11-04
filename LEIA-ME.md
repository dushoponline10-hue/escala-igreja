# Escala Igreja Viver

App de escala de voluntários. Cada pessoa cria a conta, vê as datas em que está escalada e recebe aviso no celular **na véspera e no dia** (às 7h).

## O que tem no app

- **Login / Criar conta**: nome, WhatsApp, e-mail e senha.
- **Minhas escalas**: próximas datas, ministério, função, horário e quem serve junto.
- **Ativar avisos**: liga as notificações no celular, com botão de teste.
- **Montar escalas** (só admin): cria escala escolhendo data, ministério e várias pessoas de uma vez; gerencia ministérios e quem é admin.
- **A primeira conta criada vira admin automaticamente.** Crie a sua antes de divulgar o link.

## Passo a passo

### 1. Criar o projeto no Supabase (grátis)
1. Entre em supabase.com, crie uma conta e clique em **New project**.
2. Anote a **senha do banco** que você definir.
3. Em **Authentication > Sign In / Providers > Email**, desligue **Confirm email** (assim ninguém precisa confirmar por e-mail para entrar).

### 2. Preencher o arquivo `.env.local`
Abra o `.env.local` e preencha os 4 primeiros campos (as dicas de onde achar cada um estão no próprio arquivo). Não mexa nos 3 últimos.

### 3. Criar o banco e testar no computador
Precisa do Node.js instalado (nodejs.org, versão LTS). Na pasta do projeto, no terminal:

```
npm install
npm run db:setup
npm run dev
```

Abra http://localhost:3000, crie sua conta (vai virar admin) e monte uma escala de teste.

### 4. Publicar na internet (Vercel, grátis)
1. Suba a pasta para um repositório no GitHub (o `.env.local` fica de fora sozinho).
2. Em vercel.com, clique em **Add New > Project** e importe o repositório.
3. Em **Environment Variables**, cole as 7 variáveis do `.env.local` (pode colar o arquivo inteiro de uma vez).
4. Clique em **Deploy**. O lembrete diário já vem configurado no `vercel.json`.

### 5. Divulgar para a igreja
Mande o link do app. Peça para cada pessoa:
- **Android**: abrir no Chrome, criar conta e tocar em **Ativar avisos**. Aceitar a sugestão de "Instalar app".
- **iPhone**: abrir no Safari, tocar em **Compartilhar > Adicionar à Tela de Início**, abrir pelo ícone, criar conta e tocar em **Ativar avisos**. (Sem estar na tela inicial, o iPhone não recebe aviso.)

## Testar o lembrete na hora
Com o app publicado, rode no terminal (troque o endereço):

```
curl -H "Authorization: Bearer SEU_CRON_SECRET" https://seu-app.vercel.app/api/cron/lembretes
```

Ele avisa quem está escalado hoje e amanhã (cada aviso sai só uma vez).

## Ajustes fáceis
- **Horário do lembrete**: em `vercel.json`, `"0 10 * * *"` = 7h de Brasília (10h UTC). Para 8h, use `"0 11 * * *"`.
- **Ministérios iniciais**: Louvor, Mídia, Recepção, Kids e Intercessão. Edite no painel.
