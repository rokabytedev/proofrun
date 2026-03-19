## 1. Package cleanup

- [x] 1.1 Exclude test files from npm package (used `!**/*.test.js` negation in `files` array instead of `.npmignore`)
- [x] 1.2 Update `package.json`: change `description` to `"Agent skill for verifying app behavior — capture evidence, generate interactive reports for human review"`
- [x] 1.3 Update `package.json`: add `"engines": { "node": ">=22" }`
- [x] 1.4 Update `package.json`: update `keywords` to `["ai-agent", "agent-skill", "verification", "mobile", "evidence", "report", "proof-of-work", "claude-code"]`

## 2. CI workflow

- [x] 2.1 Create `.github/workflows/ci.yml` — runs `npm ci` + `npm test` on push to main and on PRs, Node 22 matrix, ubuntu-latest

## 3. Release automation

- [x] 3.1 Create `.release-please-manifest.json` with `{ ".": "0.2.0" }`
- [x] 3.2 Create `release-please-config.json` with node release-type and changelog-path config
- [x] 3.3 Create `.github/workflows/release-please.yml` — uses manifest strategy, publishes to npm on release via `NPM_TOKEN` secret

## 4. Changelog

- [x] 4.1 Create `CHANGELOG.md` with retroactive entries for v0.1.0 and v0.2.0 derived from git history

## 5. README rewrite

- [x] 5.1 Rewrite `README.md` with agent-first structure: badges, one-liner, philosophy, problem statement, how it works diagram, install (skill first), agent workflow overview, report section, CLI reference (secondary), expanded philosophy, license

## 6. GitHub repo metadata

- [x] 6.1 Set repo description via `gh repo edit --description`
- [x] 6.2 Set repo topics via `gh repo edit --add-topic`
- [x] 6.3 Set repo homepage via `gh repo edit --homepage` (npm page URL)
