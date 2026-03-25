# PersonalRepo

Integrated Personal Web Portal

## MVP Scope

- Category CRUD (with uncategorized fallback)
- Report CRUD with LocalStorage persistence
- Markdown + LaTeX preview
- Report Markdown export/import
- Full JSON backup/restore

## Site Structure

- Portal: `/` (integrated landing page)
- Report Editor: `/editor/`
- Presentations: `/presentations/`
- Projects: `/projects/`

## Local Run

- Open `index.html` in repository root to access the integrated portal
- Open `editor/index.html` to run the report editor directly
- Or serve the repository root with any static server

## Documentation

- User Guide: [manual.md](./manual.md)

## Stack

- HTML, CSS, JavaScript (ES modules)
- markdown-it
- DOMPurify
- KaTeX (auto-render)

## Live URL

- Portal: <https://shiroshio.github.io/PersonalRepo/>
- Editor: <https://shiroshio.github.io/PersonalRepo/editor/>

## Deployment

This repository is deployed with GitHub Pages via GitHub Actions.

- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` branch
- Artifact path: repository root (`.`)

If Pages is not active yet, open repository settings and set the Pages source to GitHub Actions.
