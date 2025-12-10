# Claude Development Workflow

## Project Overview
Google Classroom Integration - syncs data from Frontline TEAMS SIS to Google Classroom.

## Tech Stack
- React 18 + TypeScript
- Vite 6
- Turborepo (monorepo)
- npm (packageManager)
- Vitest (unit testing)
- Playwright (E2E testing)

## Development Workflow

### 1. Pick an Issue
- Pick responsibly - not just the easiest ones
- Choose foundational/impactful issues first
- Assign yourself and update status to "in progress"

```bash
gh issue list --state open
gh issue edit <number> --add-assignee @me
```

### 2. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/<issue-number>-<short-description>
```

Branch naming examples:
- `feature/5-github-actions-ci`
- `feature/62-vitest-setup`
- `fix/24-api-error-handling`

### 3. Implement the Feature
- Write clean, typed code
- Add tests (unit and/or E2E as appropriate)
- Take screenshots for UI changes
- Run local checks before pushing

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

### 4. Commit and Push
```bash
git add .
git commit -m "feat(scope): description

Closes #<issue-number>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin feature/<branch-name>
```

### 5. Create Pull Request
```bash
gh pr create --title "feat(scope): description" --body "## Summary
- What this PR does

## Test Plan
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] Screenshots attached (for UI changes)

Closes #<issue-number>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

### 6. PR Checks
- CI must pass (type-check, lint, test, build)
- Own the PR - fix any failing checks
- Don't wait for human review
- Look for comment from "Claude" bot if configured

### 7. Merge
```bash
gh pr merge --squash --delete-branch
```

### 8. Verify Main is Green
```bash
git checkout main
git pull origin main
npm run build
```

### 9. Repeat
Go back to step 1 - infinite dev loop.

## Commands Reference

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run lint         # ESLint
```

### Testing
```bash
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
```

### Git & GitHub
```bash
gh issue list                    # List issues
gh issue view <number>           # View issue details
gh pr list                       # List PRs
gh pr checks                     # View PR check status
gh pr merge --squash             # Merge PR
```

## Project Structure
```
google-classroom/
├── apps/
│   └── web/                 # React application
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── App.tsx
│       │   ├── googleApi.ts # Google API utilities
│       │   └── types.ts     # TypeScript types
│       ├── e2e/            # Playwright tests
│       └── package.json
├── packages/               # Shared packages
├── .github/
│   └── workflows/         # GitHub Actions
├── scripts/               # Utility scripts
├── turbo.json
├── package.json
└── CLAUDE.md              # This file
```

## Environment Setup
1. Copy `apps/web/.env.example` to `apps/web/.env`
2. Add Google OAuth Client ID
3. Run `npm install`
4. Run `npm run dev`

## CI/CD
GitHub Actions runs on every PR:
- Type checking
- Linting
- Unit tests
- Build verification

Main branch should always be green.
