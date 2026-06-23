# Yuanle Yao — Personal Website V3

A full-stack portfolio with editorial design, real-time interactions, and a narrative experience timeline.

Built with **Next.js 16** + **TypeScript** + **Tailwind CSS**.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
src/
  app/            # Next.js App Router pages + API routes
  components/     # React components
    pages/        # Page-level components (home, experience, skills, projects, lab)
  lib/            # Data, i18n, DB helpers, narrative data
  types/          # TypeScript type definitions
data/             # SQLite databases (guestbook, visits)
public/           # Static assets
```

## Deployment

Automatically deployed via GitHub Actions to Vercel on push to `master`.
