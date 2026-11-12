# My Store (core version)

Express + vanilla JS. SQLite locally (Node 22.5+ built-in), PostgreSQL in production. `main.js` auto-loads every folder in `modules/` (each exports `{name, mount(app, ctx)}`) — to add a feature, drop in a new folder.

## Run locally
```
npm install
cp .env.example .env        # fill JWT_SECRET (and PAYSTACK_SECRET_KEY to take payments)
npm run create-admin -- you@example.com 'long-password'
npm start                   # storefront: /   admin: /admin/
npm test
```

## Free-first deployment (be aware of limits)
- **Code:** GitHub repo (push this folder).
- **Database:** Neon free PostgreSQL (persistent). Put its URL in `DATABASE_URL`. Do NOT use SQLite on free hosts — their disks are wiped on restart. (Render's own free Postgres expires after a limited period; check current terms.)
- **Backend + storefront:** Render free web service (build `npm install`, start `npm start`). Free services sleep when idle, so the first visit after a pause is slow. Set `JWT_SECRET`, `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `PUBLIC_URL`, `NODE_ENV=production`.
- The backend also serves the storefront, so GitHub Pages is not needed (and cookies stay same-site). Paid upgrades: always-on instance, custom-domain extras.
- Then run `create-admin` once (Render shell, or locally with the production `DATABASE_URL`).

## Not built yet
See the chat reply for the list of features still to add.

## CSV import/export and Meta feed
Admin > Import/export: download products.csv, edit in a spreadsheet, re-upload. "Check file" validates and shows what will be created/overwritten; nothing changes until you click "Confirm import". Rows match on `sku`.
Facebook/Instagram catalog: in Commerce Manager add a data source > Scheduled feed > paste `https://YOUR-SITE/feeds/meta.csv` (hourly). Your store is the source of truth; edit here, never in Facebook. Check Diagnostics in Commerce Manager for rejected items.
Keep-alive: point a free uptime monitor at `/health` every 5 minutes.
