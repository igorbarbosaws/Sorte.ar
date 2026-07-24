# Sorte.ar — Guia de Deploy

Este documento cobre o deploy completo da aplicação: banco de dados, backend (API) e frontend (static files).

---

## Visão geral da arquitetura

```
[Usuário]
    │
    ▼
[Servidor estático / CDN]   ← index.html + css/ + js/
    │  (proxy /api/* → backend)
    ▼
[Node.js API — Express]     ← server/
    │
    ├── PostgreSQL 16
    ├── Redis (opcional, rate limiting distribuído)
    └── Cloudinary (avatares)
```

O frontend é vanilla HTML/JS e pode ser servido por **qualquer servidor estático** (Nginx, Vercel, Netlify, GitHub Pages, etc.).  
A API em Node.js precisa de **um servidor com Node 20+** e acesso ao PostgreSQL.

O `API_BASE` no frontend é `/api`, então o servidor estático deve fazer **proxy reverso** de `/api/*` para o backend.

---

## Opção 1 — Railway (recomendada para projetos pequenos)

Railway provisiona PostgreSQL, Redis e Node.js no mesmo lugar.

### 1.1 Banco de dados

1. Acesse [railway.app](https://railway.app) e crie um novo projeto.
2. Adicione um serviço **PostgreSQL** — o Railway gera a `DATABASE_URL` automaticamente.
3. (Opcional) Adicione um serviço **Redis** — o Railway gera a `REDIS_URL` automaticamente.

### 1.2 Backend

1. Adicione um serviço **GitHub Repo** apontando para este repositório.
2. Defina o **Root Directory** como `server`.
3. Configure as variáveis de ambiente (seção abaixo).
4. O Railway detecta `npm run build` + `npm start` automaticamente via `package.json`.

### 1.3 Frontend

O frontend é estático e não precisa de build. Opções:
- **Vercel / Netlify**: faça deploy da pasta raiz (`index.html`, `css/`, `js/`). Configure um rewrite de `/api/*` para a URL pública do backend no Railway.
- **Mesmo servidor Nginx**: sirva os arquivos estáticos e faça proxy de `/api/*`.

---

## Opção 2 — VPS com Nginx + PM2

### 2.1 Requisitos

- Ubuntu 22.04 LTS (ou similar)
- Node.js 20 (`nvm` recomendado)
- PostgreSQL 16
- Redis 7 (opcional)
- Nginx
- PM2 (`npm i -g pm2`)

### 2.2 Banco de dados

```bash
sudo -u postgres psql
CREATE USER sortear WITH PASSWORD 'senha_forte';
CREATE DATABASE sorte_ar OWNER sortear;
\q
```

### 2.3 Deploy do backend

```bash
# Clone e instale dependências
git clone https://github.com/seu-usuario/Sorte.ar.git /var/www/sortear
cd /var/www/sortear/server

# Crie o .env
cp .env.example .env
nano .env   # preencha todos os valores (veja seção de variáveis)

# Instale e compile
npm install
npm run build

# Aplique as migrações
npm run db:migrate

# Inicie com PM2
pm2 start dist/app.js --name sortear-api
pm2 save
pm2 startup   # siga as instruções para iniciar no boot
```

### 2.4 Nginx

```nginx
server {
    listen 80;
    server_name seudominio.com;

    # Frontend (arquivos estáticos)
    root /var/www/sortear;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para a API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Ative HTTPS com Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

---

## Variáveis de ambiente (server/.env)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | **Sim** | `postgresql://user:senha@host:5432/sorte_ar` |
| `JWT_SECRET` | **Sim** | String aleatória ≥ 64 caracteres |
| `JWT_ACCESS_EXPIRES_IN` | Não (padrão `60m`) | Expiração do access token |
| `JWT_REFRESH_EXPIRES_IN` | Não (padrão `7d`) | Expiração do refresh token |
| `REDIS_URL` | Não | `redis://localhost:6379` — sem isso usa MemoryStore |
| `CLOUDINARY_CLOUD_NAME` | Sim (para avatares) | Cloud name do Cloudinary |
| `CLOUDINARY_API_KEY` | Sim (para avatares) | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | Sim (para avatares) | API Secret do Cloudinary |
| `PORT` | Não (padrão `3000`) | Porta da API |
| `NODE_ENV` | Não | `production` em produção |
| `CORS_ORIGIN` | Não | URL do frontend, ex: `https://seudominio.com` |

Gere um JWT_SECRET seguro com:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Checklist de deploy

- [ ] PostgreSQL rodando e acessível
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` gerado e configurado (≥ 64 chars)
- [ ] Cloudinary configurado (ou avatares desabilitados)
- [ ] `npm install` executado em `server/`
- [ ] `npm run build` executado com sucesso
- [ ] `npm run db:migrate` aplicou as migrações
- [ ] `CORS_ORIGIN` aponta para o domínio do frontend
- [ ] `NODE_ENV=production` definido
- [ ] HTTPS habilitado no domínio público

---

## Atualizações

```bash
cd /var/www/sortear
git pull

cd server
npm install
npm run build
npm run db:migrate   # somente se houver novas migrações

pm2 restart sortear-api
```
