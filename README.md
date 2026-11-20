# Quiet Moment

A Vue 3 app for guided breathing, sensory grounding and quiet background audio.

## Development

Use Node 24 and pnpm 12.16.1, then run:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

## Quality checks

```sh
pnpm run check
```

This runs ESLint, Prettier checks and the production build. Use `pnpm run lint:fix` and `pnpm run format` to apply fixes. Commit `pnpm-lock.yaml` whenever dependencies change.

## Vercel

Import `SteveWalsh1989/quiet-moment` using the Vite preset and Node 24. Build settings are in `vercel.json`: install with `pnpm install --frozen-lockfile`, run `pnpm run check`, and serve `dist`. Use `main` as the production branch. No application environment variables are required.

The production app includes Vercel Web Analytics. In the Vercel project, open Analytics and enable Web Analytics before deployment. After deploying, visit the live site and confirm page views appear in Analytics. URL query parameters and fragments are removed before analytics events are sent. Exercise settings stay in browser storage.

## Project status

ESLint, Prettier, and the production build pass with the available dependencies. The pnpm lockfile has been regenerated offline. A clean install needs registry access because some package tarballs are not cached. GitHub publication, production deployment, and dashboard analytics activation remain pending until their remote steps complete.

The connected GitHub integration authenticates as `SteveWalsh1989`. This workspace cannot resolve GitHub or npm registry hosts from its terminal, and GPG cannot access the existing keybox to sign the initial commit. The files are staged, signing remains enabled, and no initial commit or push has completed. Vercel project creation returned HTTP 403, so no Vercel project was created here.

## GitHub publication

From a terminal with GitHub access, verify authentication and publish the private repository:

```sh
gh auth status
git add .
git commit -m "Prepare Quiet Moment for private GitHub and Vercel"
gh repo create SteveWalsh1989/quiet-moment --private --source=. --remote=origin --push
```

Git uses your existing commit-signing configuration; do not disable signing to work around an unavailable signing agent. If an initial commit already exists, skip the commit command. Verify the repository is private with `gh repo view SteveWalsh1989/quiet-moment --json visibility,url`.
