# Branch Strategy

## Branch Structure

### Main Branches

- **`main`** - Production-ready code
  - Deploys to: https://repair.theprofitplatform.com.au
  - Protected: Requires PR reviews
  - Auto-deploys on push

- **`develop`** - Integration branch for features
  - Deploys to: https://test.theprofitplatform.com.au
  - All feature branches merge here first
  - Testing ground before production

### Feature Branches

Format: `feat/description` or `fix/description` or `refactor/description`

Examples:
- `feat/authentication`
- `feat/input-validation`
- `fix/prisma-client`
- `refactor/type-safety`

### Workflow

1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature
   ```

2. Make changes and commit

3. Push and create PR to `develop`:
   ```bash
   git push origin feat/your-feature
   ```

4. After testing on test environment, merge `develop` → `main`

## Branch Protection Rules

### `main` branch:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No direct pushes (except emergency hotfixes)

### `develop` branch:
- ✅ Require status checks to pass
- ✅ Allow direct pushes for rapid iteration

## Deployment Strategy

```
feat/feature-1 ─┐
feat/feature-2 ─┼──> develop ───test──> main ───> production
fix/bug-fix ────┘              (test)            (prod)
```

## Emergency Hotfixes

For critical production issues:

1. Branch from `main`:
   ```bash
   git checkout main
   git checkout -b hotfix/critical-issue
   ```

2. Fix and test

3. Merge to both `main` AND `develop`:
   ```bash
   git checkout main
   git merge hotfix/critical-issue
   git push

   git checkout develop
   git merge hotfix/critical-issue
   git push
   ```

## Commit Message Convention

Follow conventional commits:

```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security fixes

Examples:
```
feat: add NextAuth authentication

Implement authentication using NextAuth with credentials provider.
Protects all /api routes and /dashboard pages.

Closes #123
```

```
fix: resolve duplicate Prisma client instances

Consolidate lib/prisma.ts and lib/db.ts into single client.
Prevents connection pool exhaustion.
```

## Pre-commit Checklist

Before committing:
- [ ] Code passes TypeScript checks: `npm run build`
- [ ] Code passes linting: `npm run lint`
- [ ] Tests pass (when implemented): `npm run test`
- [ ] No console.log statements in production code
- [ ] No secrets or API keys in code
- [ ] Comments explain complex logic

## Code Review Checklist

When reviewing PRs:
- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced
- [ ] Tests included (when applicable)
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance impact considered
