# Agent memory — WYA security & domains

Persistent notes for future sessions (pair with `.cursor/rules/secrets-and-domains.mdc`).

## Incidents we already hit (do not repeat)

1. **Hardcoded Supabase PAT (`sbp_…`)** in `mcp.json` and `IMPLEMENTATION_GUIDE.md` — committed and later expired/401. Always use gitignored `mcp-config.env` + placeholders; rotate after any chat paste.
2. **Admin on consumer domain** — `/admin` on `www.wya254.com` was wrong. Production split: `admin.wya254.com` (ops) vs `www.wya254.com` (app). Code: `HostGate`, `AdminHostRoutes`, `vercel.json` redirects.
3. **CORS** — Edge `ALLOWED_ORIGINS` must include `https://admin.wya254.com` or admin Edge calls fail. Set via Management API (`POST /v1/projects/{ref}/secrets`), not repo files.
4. **Vercel Root Directory `.`** — local link/`directory: "."` broke `vercel --prod`. Keep root empty/null; fix `.vercel/repo.json` `directory` to `""`.
5. **Huge CLI upload** — without `.vercelignore`, deploy tried to upload android/git; use ignore + `--archive=tgz` or Git-based deploy.

## Current production facts

- Project ref: `nnlxxbuekqlaqamczwyi`
- Vercel team/project: `wyas-projects/wya`
- Domains: `www.wya254.com`, `admin.wya254.com`, apex → www
- Optional build env: `VITE_PUBLIC_SITE_URL`, `VITE_ADMIN_SITE_URL`

## Prefer

- Management API / Dashboard for secrets  
- Env placeholders in committed MCP config  
- British English in user-facing replies; never echo secret values
