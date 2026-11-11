# Deploy: www.lorenamaruch.com (Cloudflare DNS → GitHub Pages)

**Estado atual (11/11/2026):** o domínio `lorenamaruch.com` já usa os nameservers da Cloudflare (`rajeev` / `roxy`). Ele ainda não tem nenhum registro DNS, então começamos do zero. O repositório `samuelchiari-glitch/lorena` é público, e o GitHub Pages é gratuito para repositórios públicos.

O site é publicado pelo workflow `.github/workflows/pages.yml`, que roda a cada push em `main` ou `claude/upbeat-dirac-mij6ct`. Ele copia só os arquivos públicos (`index.html`, `css/`, `js/`, `assets/`, `data/`, `lab/`…) e publica. A pasta `_source/` (exports brutos) e a `docs/` não vão para o ar.

## 1. GitHub: ligar o Pages (1 clique)

1. Abra https://github.com/samuelchiari-glitch/lorena/settings/pages
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Em **Custom domain**, digite `www.lorenamaruch.com` e clique em **Save**.
4. Depois que o DNS propagar (passo 2), marque **Enforce HTTPS**. O certificado leva de alguns minutos a cerca de 1 hora.

> Se o primeiro deploy falhar com "Branch not allowed to deploy", vá em
> Settings → Environments → `github-pages` → Deployment branches e adicione a branch usada.

## 2. Cloudflare: registros DNS

Cloudflare → `lorenamaruch.com` → **DNS → Records** → Add record.
Deixe todos como **DNS only (nuvem cinza)**. Com o proxy laranja, o GitHub não consegue emitir o certificado HTTPS.

| Tipo  | Nome  | Conteúdo                       | Proxy    |
|-------|-------|--------------------------------|----------|
| CNAME | `www` | `samuelchiari-glitch.github.io` | DNS only |
| A     | `@`   | `185.199.108.153`              | DNS only |
| A     | `@`   | `185.199.109.153`              | DNS only |
| A     | `@`   | `185.199.110.153`              | DNS only |
| A     | `@`   | `185.199.111.153`              | DNS only |
| AAAA  | `@`   | `2606:50c0:8000::153`          | DNS only |
| AAAA  | `@`   | `2606:50c0:8001::153`          | DNS only |
| AAAA  | `@`   | `2606:50c0:8002::153`          | DNS only |
| AAAA  | `@`   | `2606:50c0:8003::153`          | DNS only |

Com isso, `lorenamaruch.com` (sem www) redireciona sozinho para `https://www.lorenamaruch.com`.

**SSL/TLS na Cloudflare:** com DNS only isso não interfere. Se um dia ligar o proxy laranja, use o modo **Full (strict)**.

### Opcional (recomendado): verificar o domínio no GitHub

Isso protege contra alguém tentar usar o seu domínio em outro repositório.
GitHub → foto do perfil → **Settings → Pages → Add a domain** → `lorenamaruch.com`. O GitHub mostra um registro TXT
(`_github-pages-challenge-samuelchiari-glitch`). Crie esse TXT na Cloudflare e clique em **Verify**.

## 3. Alternativa: eu crio os registros pela API

Crie um token em Cloudflare → My Profile → **API Tokens → Create Token → Edit zone DNS**, restrito à zona `lorenamaruch.com`.
Coloque o token como secret do ambiente (`CLOUDFLARE_API_TOKEN`) nas configurações do ambiente do Claude Code. Não cole o token no chat. Com ele eu crio e verifico os registros sozinho.

## Checagem

- `https://www.lorenamaruch.com/lab/` abre as páginas de laboratório (componentes) enquanto o site não fica pronto.
- O `robots.txt` bloqueia a indexação de `/lab/`.
