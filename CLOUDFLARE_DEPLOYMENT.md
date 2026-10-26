# Cloudflare static deployment

This project is configured for Cloudflare static asset hosting through Wrangler. It does not define a Worker API, D1 database, KV namespace, or server-side application backend. The map and IP-geolocation calls run from the browser and use their named third-party providers.

## Before deploying

1. Install the project dependencies with `npm install`.
2. Sign in to the Cloudflare account that should own the site by running `npx wrangler login`.
3. Confirm the account shown by Wrangler is the intended account. Choose the deployment name and public domain carefully.

## Preview and publish

Run the local Cloudflare preview:

```bash
npm run cloudflare:dev
```

Build and publish the static site:

```bash
npm run deploy:cloudflare
```

The build script stages `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.json`, and the public images into `dist/`. Wrangler deploys that directory as static assets using `wrangler.toml`. `npm run build:cloudflare` can be run separately to inspect the generated directory before publishing.

Publishing makes the dashboard available through the Cloudflare account's configured public URL. Deployment has not been run from this project because no Cloudflare account login or site-domain choice has been supplied.
