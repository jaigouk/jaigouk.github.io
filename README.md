# jaigouk.github.io

Personal blog at [jaigouk.com](https://jaigouk.com), built with [Astro Modular](https://github.com/davidvkimball/astro-modular) (v0.8.1) and the Nord theme. Deployed to GitHub Pages via GitHub Actions.

## Prerequisites

- Node.js >= 22.12.0 (24.x recommended)
- [pnpm](https://pnpm.io/) 10.x (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`)
- [Obsidian](https://obsidian.md/) (for writing posts)

## Local Development

```sh
pnpm install
pnpm dev        # start dev server (http://localhost:5000)
pnpm build      # production build → dist/
pnpm preview    # build + preview locally
```

### Checking the site locally

```sh
# Quick preview of the production build
pnpm preview
# Open http://localhost:5000 in your browser

# Or build and serve manually
pnpm build
npx astro preview --port 5000
```

Key pages to verify:
- http://localhost:5000/ — Home page
- http://localhost:5000/posts/ — All posts (paginated)
- http://localhost:5000/projects/ — Project cards
- http://localhost:5000/about/ — About page
- http://localhost:5000/contact/ — Contact page

## Writing Posts with Obsidian

This site uses Obsidian as the content editor. Open the `src/content/` folder as an Obsidian vault.

### Creating a new post

1. Open `src/content/posts/` in Obsidian
2. Create a new `.md` file (e.g., `my-new-post.md`)
3. Add frontmatter at the top:

```yaml
---
title: "My New Post"
description: "A short description for SEO and post cards."
date: 2026-03-03
tags:
  - devops
  - tools
author: Jaigouk Kim
draft: false
---
```

4. Write your content in Markdown below the frontmatter
5. To keep it as a draft, set `draft: true` — it will only show in dev mode

### Creating a new project

1. Create a new `.md` file in `src/content/projects/`
2. Frontmatter fields:

```yaml
---
title: my-project
description: Short description.
date: 2026-01-01
categories:
  - AI
repositoryUrl: https://github.com/user/repo
status: active
draft: false
---
```

### Editing pages

Static pages live in `src/content/pages/`:
- `about.md` — About page
- `contact.md` — Contact page
- `privacy-policy.md` — Privacy policy

### Images

- **Remote images**: Use standard Markdown `![alt](https://...)`. Astro optimizes them at build time.
- **Local images**: Place in `src/content/posts/attachments/` and reference as `![alt](attachments/image.png)`. The build script syncs them to `public/` and converts to WebP.

### Obsidian plugins (optional)

The vault comes pre-configured with VaultCMS and Astro Composer plugins in `src/content/.obsidian/`. These add features like frontmatter management and content publishing, but are not required for basic writing.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which:

1. Installs dependencies with pnpm
2. Builds the site with `pnpm build`
3. Deploys `dist/` to GitHub Pages

### First-time setup

1. Go to your GitHub repo → Settings → Pages
2. Set Source to **GitHub Actions**
3. Custom domain: `jaigouk.com`
4. Enable **Enforce HTTPS**
5. DNS: point your domain's A records to GitHub Pages IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

## Project Structure

```
src/
├── content/
│   ├── posts/          # Blog posts (Markdown)
│   ├── projects/       # Project entries
│   ├── pages/          # Static pages (about, contact, privacy)
│   ├── special/        # Index page content (home, projects)
│   └── .obsidian/      # Obsidian vault config
├── config.ts           # Site configuration (theme, nav, metadata)
├── pages/              # Astro page routes
└── layouts/            # Page layouts
public/
├── CNAME               # Custom domain for GitHub Pages
├── .nojekyll           # Prevents Jekyll processing
└── favicon*.png        # Site favicons
```

## Configuration

Edit `src/config.ts` to change:
- Site title, description, author
- Theme (currently `nord`)
- Navigation items
- Social links
- Post card layout and pagination

## License

Theme code: MIT (David V. Kimball). Blog content: Jaigouk Kim.
