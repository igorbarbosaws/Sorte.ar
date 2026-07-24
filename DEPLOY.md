# Sorte.ar — Guia de Deploy

## Arquitetura

```
[Usuário]
    │
    ├── Frontend (HTML/CSS/JS estático) ──► Vercel
    │       └── /api/* → proxy reverso ──► Railway (API Node.js)
    │
    └── Railway
            ├── Node.js API (Express)
            ├── PostgreSQL 16
            └── Redis (opcional)
```

O frontend fica no **Vercel** (estático).  
O backend fica no **Railway** (processo Node.js contínuo + banco).

---

## Parte 1 — Backend no Railway

### 1.1 Criar conta e projeto

Acesse [railway.app](https://railway.app) e crie uma conta (pode usar o GitHub).  
Clique em **New Project**.

### 1.2 Adicionar PostgreSQL

No projeto, clique em **Add a Service → Database → PostgreSQL**.  
O Railway cria o banco e disponibiliza a variável `DATABASE_URL` automaticamente.

### 1.3 Adicionar Redis (opcional)

Clique em **Add a Service → Database → Redis**.  
Disponibiliza a variável `REDIS_URL`. Sem Redis o rate limiting usa MemoryStore (funciona, mas não é compartilhado entre instâncias).

### 1.4 Adicionar o serviço da API

Clique em **Add a Service → GitHub Repo** e selecione o repositório `Sorte.ar`.

Na aba **Settings** do serviço, configure:

| Campo | Valor |
|---|---|
| **Root Directory** | `server` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run db:migrate && npm start` |

> O `railway.toml` dentro de `server/` já define esses valores automaticamente.

### 1.5 Variáveis de ambiente

Na aba **Variables** do serviço da API, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Copie da aba Variables do serviço PostgreSQL |
| `REDIS_URL` | Copie da aba Variables do serviço Redis (se adicionado) |
| `JWT_SECRET` | Gere com o comando abaixo |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL do seu projeto no Vercel (ex: `https://sorte-ar.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Do painel do Cloudinary |
| `CLOUDINARY_API_KEY` | Do painel do Cloudinary |
| `CLOUDINARY_API_SECRET` | Do painel do Cloudinary |

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.6 Deploy

Após configurar as variáveis, clique em **Deploy** (ou o Railway faz automaticamente ao detectar o push).  
Acompanhe os logs — o start command executa `db:migrate` antes de subir o servidor.

### 1.7 Pegar a URL pública da API

Na aba **Settings → Networking**, clique em **Generate Domain**.  
Vai gerar uma URL como `https://sorte-ar-api.up.railway.app`.

**Guarde essa URL** — ela vai no `vercel.json` do frontend.

---

## Parte 2 — Frontend no Vercel

### 2.1 Atualizar o vercel.json

Abra `vercel.json` na raiz do projeto e substitua `RAILWAY_API_URL` pela URL real do Railway:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://sorte-ar-api.up.railway.app/api/:path*"
    }
  ]
}
```

Faça commit e push dessa alteração.

### 2.2 Configurar o projeto no Vercel

No painel do Vercel:
- **Framework Preset:** Other
- **Root Directory:** `.` (raiz do repositório)
- **Build Command:** deixe vazio (não há build)
- **Output Directory:** `.` (raiz)
- **Install Command:** deixe vazio

Não há variáveis de ambiente necessárias no Vercel — o frontend é puramente estático.

### 2.3 Deploy

Clique em **Deploy**. O Vercel detecta o `vercel.json` e configura o proxy automaticamente.

---

## Parte 3 — Cloudinary (avatares)

1. Crie uma conta gratuita em [cloudinary.com](https://cloudinary.com)
2. No painel, acesse **Dashboard** → copie **Cloud Name**, **API Key** e **API Secret**
3. Adicione esses valores nas variáveis do Railway (passo 1.5)

---

## Checklist final

- [ ] Railway: PostgreSQL provisionado
- [ ] Railway: variáveis de ambiente configuradas (especialmente `JWT_SECRET` e `NODE_ENV=production`)
- [ ] Railway: `CORS_ORIGIN` apontando para a URL do Vercel
- [ ] Railway: deploy concluído e `/health` retornando `{"status":"ok"}`
- [ ] `vercel.json`: `RAILWAY_API_URL` substituído pela URL real do Railway
- [ ] Vercel: deploy do frontend concluído
- [ ] Cloudinary: credenciais configuradas no Railway
- [ ] Teste: registrar usuário, fazer login, criar campeonato

---

## Atualizações futuras

```bash
# Apenas faça push para o GitHub — Railway e Vercel fazem redeploy automático.
git push origin main
```

Se houver novas migrações de banco, o `db:migrate` no start command as aplica automaticamente.
