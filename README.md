# PersonalRepo

Personal Report Site

## MVP Scope

- Category CRUD (with uncategorized fallback)
- Report CRUD with LocalStorage persistence
- Markdown + LaTeX preview
- Report Markdown export/import
- Full JSON backup/restore

## Local Run

- Open `index.html` directly in a browser, or
- Serve the repository root with any static server

## Documentation

- User Guide: [manual.md](./manual.md)

## Stack

- HTML, CSS, JavaScript (ES modules)
- markdown-it
- DOMPurify
- KaTeX (auto-render)

## Live URL

- https://shiroshio.github.io/PersonalRepo/

## Deployment

This repository is deployed with GitHub Pages via GitHub Actions.

- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` branch
- Artifact path: repository root (`.`)

If Pages is not active yet, open repository settings and set the Pages source to GitHub Actions.
