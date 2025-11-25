# ✅ ESLint Setup Complete

ESLint has been successfully configured for this Next.js project with TypeScript support.

## What Was Installed

```bash
pnpm add -D \
  eslint \
  eslint-config-next \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  @eslint/compat \
  @eslint/js \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  typescript-eslint \
  globals
```

## Configuration

### ESLint Config ([eslint.config.mjs](eslint.config.mjs))

Using ESLint v9 flat config format with:
- ✅ TypeScript support
- ✅ React and React Hooks rules
- ✅ Next.js best practices
- ✅ Reasonable defaults (warnings for most issues)

### Custom Rules

```javascript
{
  "@typescript-eslint/no-explicit-any": "warn",           // Warn on 'any' types
  "@typescript-eslint/no-unused-vars": "warn",            // Warn on unused vars/args (ignore _prefixed)
  "react-hooks/exhaustive-deps": "warn",                  // Warn on missing dependencies
  "react/react-in-jsx-scope": "off",                      // Not needed in Next.js
  "react/prop-types": "off",                              // Using TypeScript instead
  "react/no-unescaped-entities": "off",                   // Allow apostrophes in JSX
  "no-useless-escape": "error",                           // Flag unnecessary escapes
  "prefer-const": "warn",                                  // Suggest const over let
  "no-console": "off"                                     // Allow console.log
}
```

## Scripts Available

```bash
# Run ESLint on entire project
pnpm lint

# Auto-fix issues where possible
pnpm lint:fix

# Check TypeScript types (no ESLint)
pnpm type-check
```

## Current Status

**After initial setup:**
- ✅ 0 errors
- ⚠️ 79 warnings (non-blocking)

Most warnings are:
- `@typescript-eslint/no-explicit-any` (39) - Using `any` type
- `@typescript-eslint/no-unused-vars` (18) - Unused variables/imports
- Minor code style issues

These are intentionally set to "warn" rather than "error" to avoid blocking builds.

## IDE Integration

### VS Code

Install the ESLint extension:
```bash
code --install-extension dbaeumer.vscode-eslint
```

Add to `.vscode/settings.json`:
```json
{
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Other IDEs

- **WebStorm**: ESLint support built-in (Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint)
- **Cursor**: Uses VS Code extensions
- **Zed**: ESLint support via language server

## Fixing Warnings Gradually

The 79 warnings can be fixed over time. Priority order:

### 1. Remove Unused Variables (Low effort, 18 warnings)

Prefix unused vars with underscore:
```typescript
// Before
function foo(bar, baz) {  // 'baz' is unused
  return bar;
}

// After
function foo(bar, _baz) {
  return bar;
}
```

### 2. Type the 'any' Types (Medium effort, 39 warnings)

Replace `any` with proper types:
```typescript
// Before
function process(data: any) { ... }

// After
function process(data: Lead | Organization) { ... }
```

### 3. Review React Hooks Dependencies (Medium effort, varies)

Add missing dependencies or disable rule with comment:
```typescript
useEffect(() => {
  // If dependency is intentionally omitted:
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/ci.yml`:
```yaml
- name: Lint
  run: pnpm lint
```

### Pre-commit Hook

Install husky and lint-staged:
```bash
pnpm add -D husky lint-staged

# Add to package.json:
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix"]
  }
}
```

## Migration from Old Config

If you see `.eslintrc.json` or `.eslintrc.js`:
- ESLint v9+ uses `eslint.config.mjs` (flat config)
- Old format is deprecated
- This project uses the new format

## Troubleshooting

### "Invalid project directory provided"

This was a bug with `next lint` in some setups. Use `npx eslint .` instead.

### "Circular structure" error

Fixed by using `@eslint/compat` instead of `FlatCompat` directly.

### ESLint not running in IDE

1. Reload IDE window
2. Check ESLint output panel for errors
3. Verify `eslint.config.mjs` exists in project root

### "Cannot find module" errors

```bash
# Reinstall ESLint packages
pnpm add -D eslint eslint-config-next
```

## Disabling Rules

### Per-file

Add comment at top of file:
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Per-line

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = {};
```

### Entire project

Edit [eslint.config.mjs](eslint.config.mjs):
```javascript
rules: {
  "@typescript-eslint/no-explicit-any": "off"
}
```

## Benefits

✅ **Catch errors early** - Find bugs before runtime
✅ **Consistent code style** - Team follows same patterns
✅ **Better IDE support** - Auto-complete and inline errors
✅ **Prevent bad patterns** - React hooks, unused vars, etc.
✅ **Type safety** - Works alongside TypeScript

## Maintenance

### Updating ESLint

```bash
pnpm update eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Adding New Rules

Edit [eslint.config.mjs](eslint.config.mjs) and add to `rules` object:
```javascript
rules: {
  "no-var": "error",  // Disallow var keyword
  "eqeqeq": "warn"    // Warn on == instead of ===
}
```

### Ignoring Files

Files/patterns already ignored:
- `node_modules/**`
- `.next/**`
- `*.config.{js,ts}`
- Build directories

Add more in [eslint.config.mjs](eslint.config.mjs):
```javascript
{
  ignores: ["scripts/**", "*.test.ts"]
}
```

## Next Steps

1. ✅ **Done**: ESLint configured and working
2. **Optional**: Set up pre-commit hooks with husky
3. **Optional**: Add ESLint to CI/CD pipeline
4. **Gradual**: Fix warnings over time (not urgent)

---

**Status**: ✅ Complete and Operational
**Errors**: 0
**Warnings**: 79 (non-blocking, can be fixed gradually)
