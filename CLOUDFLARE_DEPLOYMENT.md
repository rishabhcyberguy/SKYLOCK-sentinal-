# SKYLOCK SENTINEL · Cloudflare Hosting Guide

This project is configured and verified for deployment to **Cloudflare Pages** or **Cloudflare Workers (Static Assets)** with single-page application (SPA) routing.

---

## 🚀 Quick Deployment with Wrangler CLI

### Option A: Local Terminal Deployment

1. **Build the production distribution:**
   ```bash
   npm run build:cloudflare
   ```
   *(This generates the optimized `dist/` directory and verifies static bundle integrity).*

2. **Authenticate with your Cloudflare account:**
   ```bash
   npx wrangler login
   ```
   *(Opens your browser to authorize Wrangler with your Cloudflare account).*

3. **Deploy to Cloudflare:**
   ```bash
   npx wrangler deploy
   ```
   *(Or run `npm run deploy:cloudflare`)*

4. Wrangler will deploy the static distribution from `./dist` and output your live deployment URL:
   `https://skylock-sentinel.<your-subdomain>.workers.dev`

---

## 🌐 Option B: Cloudflare Pages Git Integration (Continuous Deployment)

If your repository is hosted on GitHub or GitLab:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Compute (Workers) > Pages > Connect to Git**.
3. Select your repository.
4. Configure the build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
5. Click **Save and Deploy**. Cloudflare will build and host your application with automatic SSL and global CDN distribution.

---

## ⚙️ Configuration Files

- **`wrangler.toml`**:
  ```toml
  name = "skylock-sentinel"
  compatibility_date = "2026-10-25"

  [assets]
  directory = "./dist"
  not_found_handling = "single-page-application"
  ```
  `not_found_handling = "single-page-application"` ensures that standalone sub-views (like `?view=radar` and `?view=location-intel`) load properly.

---

## ✅ Deployment Checklist

- [x] Production build tested and verified (`dist/index.html` bundled)
- [x] Three.js procedural 3D drone and radar components bundled with zero external asset dependencies
- [x] Tailwind CSS v4 styling fully compiled
- [x] Single-page application fallback routing enabled
- [x] Real-time Firebase Firestore client initialized
