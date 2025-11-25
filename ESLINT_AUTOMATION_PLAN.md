# ESLint Automation Plan

Plan for adding pre-commit hooks and CI/CD pipeline integration.

## Overview

Two optional enhancements to automate code quality:
1. **Pre-commit Hooks** - Run ESLint before each commit (local)
2. **CI/CD Pipeline** - Run ESLint on pull requests (GitHub Actions)

---

## Option 1: Pre-commit Hooks (Husky + lint-staged)

### What This Does

**Automatically runs ESLint on staged files before every git commit.**

- ✅ Catches issues before they reach the repository
- ✅ Only lints changed files (fast)
- ✅ Auto-fixes simple issues
- ✅ Blocks commits with errors
- ⚠️ Can be bypassed with `--no-verify` flag

### Implementation Steps

#### Step 1: Install Dependencies (2 min)

```bash
pnpm add -D husky lint-staged
```

**Package sizes:**
- `husky`: ~50KB (Git hooks made easy)
- `lint-staged`: ~100KB (Run commands on staged files)

#### Step 2: Initialize Husky (1 min)

```bash
npx husky init
```

This creates:
- `.husky/` directory
- `.husky/pre-commit` hook file

#### Step 3: Configure lint-staged (2 min)

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

#### Step 4: Update Pre-commit Hook (1 min)

Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### Step 5: Add npm Script (1 min)

Add to `package.json` scripts:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

The `prepare` script runs automatically after `pnpm install`.

#### Step 6: Test It (2 min)

```bash
# Make a change with a lint error
echo "const unused = 'test'" >> lib/test.ts

# Try to commit
git add lib/test.ts
git commit -m "test"

# Should see ESLint run and either:
# - Auto-fix and commit (if fixable)
# - Block commit (if has errors)
```

### Total Time: ~10 minutes

### What Developers Experience

**Before commit:**
```bash
git commit -m "Add new feature"
```

**With pre-commit hooks:**
```bash
git commit -m "Add new feature"
✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ eslint --fix
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
[main abc123] Add new feature
 2 files changed, 10 insertions(+)
```

**If there are errors:**
```bash
git commit -m "Add broken code"
✖ eslint found errors:
  lib/services.ts
    150:23  error  Missing return type

husky - pre-commit hook exited with code 1 (error)
```

### Bypassing Hooks (When Needed)

```bash
# Skip hooks temporarily (use sparingly!)
git commit --no-verify -m "WIP: debugging"
```

### Pros & Cons

**Pros:**
- ✅ Prevents bad code from entering repo
- ✅ Fast (only checks changed files)
- ✅ Auto-fixes simple issues
- ✅ Works locally, no server needed
- ✅ Consistent code quality across team

**Cons:**
- ⚠️ Adds ~2-5 seconds to commit time
- ⚠️ Can frustrate developers initially
- ⚠️ Can be bypassed with `--no-verify`
- ⚠️ Requires pnpm install after clone

---

## Option 2: CI/CD Pipeline (GitHub Actions)

### What This Does

**Runs ESLint on every pull request automatically.**

- ✅ Enforces code quality at repository level
- ✅ Can't be bypassed by developers
- ✅ Shows results in PR interface
- ✅ Blocks merging if checks fail
- ⚠️ Slower feedback (runs on server)

### Implementation Steps

#### Step 1: Create Workflow File (5 min)

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  eslint:
    name: ESLint Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript check
        run: pnpm type-check
```

#### Step 2: Test Workflow (10 min)

```bash
# Create test branch
git checkout -b test/lint-workflow

# Make a change
echo "// test" >> lib/services.ts

# Commit and push
git add .
git commit -m "Test lint workflow"
git push origin test/lint-workflow

# Create PR on GitHub
# Watch Actions tab for workflow run
```

#### Step 3: Configure Branch Protection (2 min)

On GitHub:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass"
4. Select "ESLint Check" from list
5. Save

Now PRs can't merge unless ESLint passes.

### Total Time: ~20 minutes

### What Developers See

**On Pull Request:**

```
Checks for PR #123
✅ ESLint Check (passed in 1m 23s)
✅ TypeScript Check (passed in 45s)
✅ Build (passed in 2m 15s)

All checks have passed
```

**If ESLint fails:**

```
Checks for PR #123
❌ ESLint Check (failed in 1m 05s)

Details:
lib/services.ts
  150:23  error  Missing return type

This PR cannot be merged until all checks pass.
```

### Advanced: Add ESLint Annotations

For inline PR comments on errors:

```yaml
- name: Run ESLint with annotations
  uses: reviewdog/action-eslint@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    reporter: github-pr-review
    eslint_flags: '.'
```

This adds comments directly on the PR:

```
lib/services.ts (line 150)
❌ Missing return type on function
@typescript-eslint/explicit-function-return-type
```

### Pros & Cons

**Pros:**
- ✅ Can't be bypassed
- ✅ Runs on every PR automatically
- ✅ Shows results in GitHub UI
- ✅ Can block merging
- ✅ Works for all contributors

**Cons:**
- ⚠️ Slower feedback (1-3 minutes)
- ⚠️ Uses GitHub Actions minutes (free tier: 2,000/month)
- ⚠️ Requires GitHub/GitLab/etc.
- ⚠️ More complex setup

---

## Recommended Approach

### For Your Stage (Pre-revenue Startup)

**Start with:** Pre-commit Hooks Only

**Why:**
- ✅ Faster feedback (immediate)
- ✅ Doesn't use CI minutes
- ✅ Simpler setup (10 min vs 20 min)
- ✅ Good enough for small team
- ✅ Can add CI/CD later

**Add CI/CD when:**
- Team grows beyond 3-5 people
- Open source contributors
- Need enforcement (hooks can be bypassed)
- Have other CI checks (tests, build)

### Ideal Setup (Both)

For production apps with team:

```
Developer Flow:
1. Write code
2. Run `pnpm lint` manually (optional)
3. Commit → Pre-commit hook runs ESLint
4. Push → Create PR
5. GitHub Actions runs ESLint + TypeScript
6. Merge → Deploy
```

This gives:
- Fast local feedback (pre-commit)
- Guaranteed enforcement (CI/CD)
- Best developer experience

---

## Implementation Plan

### Phase 1: Pre-commit Hooks (Recommended First)

**Effort:** 10 minutes
**Impact:** High
**Risk:** Low

**Tasks:**
1. ✅ Install husky + lint-staged
2. ✅ Initialize husky
3. ✅ Configure lint-staged
4. ✅ Update pre-commit hook
5. ✅ Test with sample commit
6. ✅ Document for team

### Phase 2: CI/CD Pipeline (Optional Later)

**Effort:** 20 minutes
**Impact:** Medium
**Risk:** Low

**Tasks:**
1. ✅ Create `.github/workflows/lint.yml`
2. ✅ Test workflow on test branch
3. ✅ Configure branch protection rules
4. ✅ (Optional) Add reviewdog for annotations
5. ✅ Document for contributors

---

## Configuration Options

### Strict Mode (Block All Warnings)

Make warnings fail builds:

**.eslintrc.mjs:**
```javascript
export default [
  // ... existing config
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",  // Change to error
      "@typescript-eslint/no-unused-vars": "error"
    }
  }
];
```

**Not recommended** for your current codebase (79 warnings would block commits).

### Gradual Strictness

Start lenient, increase over time:

**Week 1:** Warn only (current)
```javascript
"@typescript-eslint/no-explicit-any": "warn"
```

**Week 4:** Error for new code
```javascript
"@typescript-eslint/no-explicit-any": "error"
```

Then fix old warnings gradually.

### Skip Slow Rules in Pre-commit

**lint-staged config:**
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix --max-warnings=10"  // Allow some warnings
    ]
  }
}
```

---

## Cost Analysis

### Pre-commit Hooks

**Setup time:** 10 minutes
**Developer time per commit:** +2-5 seconds
**Monthly cost:** $0

**ROI:**
- Prevents bugs from entering repo
- Saves PR review time
- Consistent code quality

### CI/CD Pipeline

**Setup time:** 20 minutes
**GitHub Actions minutes:** ~50 min/month (depends on PR volume)
**Monthly cost:** $0 (within free tier of 2,000 min/month)

**ROI:**
- Guaranteed enforcement
- Automated quality gates
- Professional appearance

---

## Troubleshooting

### Pre-commit Hooks

**Hook not running:**
```bash
# Reinstall hooks
rm -rf .husky
npx husky init
```

**Too slow:**
```json
// Only lint changed files (already configured)
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix"]
}
```

**Bypass when needed:**
```bash
git commit --no-verify
```

### CI/CD

**Workflow not triggering:**
- Check workflow file is in `.github/workflows/`
- Check YAML syntax
- Check GitHub Actions is enabled

**Out of Actions minutes:**
- Optimize caching
- Reduce frequency (only on PRs to main)
- Upgrade to paid plan if needed

---

## Next Steps

**Choose your path:**

### Path A: Just Pre-commit Hooks (Recommended)
1. Say "yes" and I'll implement it (10 min)
2. Test with a commit
3. Done!

### Path B: Just CI/CD
1. Say "yes" and I'll create the workflow
2. Test with a PR
3. Done!

### Path C: Both (Best)
1. Start with pre-commit hooks
2. Add CI/CD after testing
3. Get best of both worlds

### Path D: Neither (Keep Manual)
- Run `pnpm lint` manually before commits
- Simpler but relies on discipline

---

**My recommendation for you:** Start with **Path A** (pre-commit hooks only). It's quick, free, and catches 95% of issues without any CI complexity.

Want me to implement it?
