## Context

Proofrun is a Node.js ES module CLI (`v0.2.0`) with no npm package published, no CI, and a CLI-centric README. The GitHub repo at `github.com/rokabytedev/proofrun` has an empty description, no topics, and no tags. The project is ready for public release — all core features are implemented and tested.

Current state:
- `README.md` — functional but leads with CLI commands, not the agent skill
- `package.json` — missing `engines` field, description says "CLI tool", test files ship to npm (25% of package)
- No `.github/workflows/` — no CI, no automated releases
- No `CHANGELOG.md` — no version history
- No git tags — release-please needs a baseline tag to start from
- GitHub repo — empty description, no topics, no homepage

Production code uses `import.meta.url` (Node 12+). Test files use `import.meta.dirname` (Node 21.2+), meaning tests require Node 22+.

## Goals / Non-Goals

**Goals:**
- Rewrite README with agent-first positioning and philosophy section
- Set up CI that runs tests on push and PR
- Set up release-please for fully automated changelog, version bumping, and npm publishing
- Bootstrap CHANGELOG.md with retroactive entries
- Exclude test files from npm package
- Set GitHub repo metadata (description, topics, homepage)
- Add badges to README (npm version, license, CI, node version)

**Non-Goals:**
- Adding CONTRIBUTING.md, CODE_OF_CONDUCT.md, or issue templates (future change)
- Hosting a demo report (no demo report exists yet)
- Broadening Node.js support below 22 (would require replacing `import.meta.dirname` in 3 test files)
- Changing any application code or behavior

## Decisions

### D1: README structure — agent-first narrative

The README leads with the skill installation, not the CLI. Structure:

```
1. Badges line
2. One-liner: "Teach your AI agent to verify its own work"
3. Philosophy: "The agent is smart, the tool is dumb"
4. The Problem (2-3 sentences: agents claim verification, can't prove it)
5. How It Works (agent-centric flow diagram + narrative)
6. Install (skill install first, then npm)
7. What the Agent Does (brief workflow overview)
8. The Report (description, placeholder for demo screenshot)
9. CLI Reference (collapsed/secondary — the command table)
10. Philosophy (expanded — what the tool does vs doesn't do)
11. License
```

**Why agent-first**: The skill IS the product. When someone runs `npx skills add rokabytedev/proofrun`, the agent learns the entire workflow from `SKILL.md`. The CLI is plumbing the skill uses. The README should reflect this.

**Badges** (first line of README):

```markdown
[![npm version](https://img.shields.io/npm/v/proofrun)](https://www.npmjs.com/package/proofrun)
[![CI](https://github.com/rokabytedev/proofrun/actions/workflows/ci.yml/badge.svg)](https://github.com/rokabytedev/proofrun/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
```

### D2: CI workflow — `.github/workflows/ci.yml`

Runs on push to `main` and on pull requests. Node 22 only (current LTS; tests use `import.meta.dirname` which requires 22+).

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

**Why single version matrix**: Tests use `import.meta.dirname` (Node 22+). Matrix with `[22]` is easy to expand later. No need for multi-OS — the CLI is pure JS with no native dependencies.

### D3: release-please workflow — `.github/workflows/release-please.yml`

Uses `googleapis/release-please-action@v4` with `release-type: node`. On merge of the release PR, it also publishes to npm.

```yaml
name: Release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: node
      - uses: actions/checkout@v4
        if: ${{ steps.release.outputs.release_created }}
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
        if: ${{ steps.release.outputs.release_created }}
      - run: npm ci
        if: ${{ steps.release.outputs.release_created }}
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        if: ${{ steps.release.outputs.release_created }}
```

**Why release-please over semantic-release**: release-please creates a visible PR you merge when ready — gives human control over release timing. semantic-release publishes on every push to main, which is too aggressive for a pre-1.0 tool.

### D4: Bootstrap strategy for release-please

release-please needs to know the current version to calculate the next one. Two options:

1. **Create a git tag `v0.2.0`** on the current HEAD before enabling release-please → it picks up from there
2. **Add a `.release-please-manifest.json`** with `{".": "0.2.0"}` → tells release-please the current version without needing a tag

**Decision**: Use option 2 (manifest file). It's self-contained and doesn't require creating retroactive tags. Also create `release-please-config.json` to configure the release type.

Files:

`.release-please-manifest.json`:
```json
{
  ".": "0.2.0"
}
```

`release-please-config.json`:
```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

When using the manifest approach, the workflow should use the manifest strategy instead of `release-type`:

```yaml
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### D5: CHANGELOG.md — bootstrapped with retroactive entries

Create a `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com) format with brief retroactive entries for v0.1.0 and v0.2.0 derived from git history. After this, release-please manages it automatically.

The CHANGELOG should be concise — just the highlights, not every commit. Group by `feat:`, `fix:`, `refactor:`, `chore:` from git history.

### D6: `.npmignore` — exclude test files

Create `.npmignore` with a single line:

```
**/*.test.js
```

This removes 7 test files (~49kB, 25% of package size) from the npm tarball. The `files` whitelist in `package.json` already excludes `openspec/`, `.github/`, etc.

### D7: `package.json` updates

Changes to `package.json`:

1. **`description`**: Change from `"CLI tool for AI agent verification workflows — capture evidence, generate interactive reports"` to `"Agent skill for verifying app behavior — capture evidence, generate interactive reports for human review"`

2. **`engines`**: Add `"engines": { "node": ">=22" }` — matches test requirements (`import.meta.dirname`). Production code works on 18+ but we set the floor at 22 for consistency.

3. **`keywords`**: Update to `["ai-agent", "agent-skill", "verification", "mobile", "evidence", "report", "proof-of-work", "claude-code"]` — more discoverable, agent-first terminology.

### D8: GitHub repo metadata

Set via `gh` CLI after implementation:

```bash
gh repo edit --description "Agent skill for verifying app behavior — the agent is smart, the tool is dumb"
gh repo edit --add-topic ai-agent,agent-skill,verification,mobile-testing,claude-code,proof-of-work
gh repo edit --homepage "https://www.npmjs.com/package/proofrun"
```

Homepage points to npm page. Can be updated to a docs site later.

## Risks / Trade-offs

**[Risk] First npm publish must be done manually** → The maintainer must run `npm login` and `npm publish` once locally to claim the package name. After that, release-please handles all future publishes via `NPM_TOKEN` secret. Detailed instructions provided in the proposal.

**[Risk] release-please creates noisy release PRs** → Each push to main updates the open release PR. This is expected behavior, not a bug. The PR accumulates changes until merged. Mitigation: just ignore the PR until ready to release.

**[Risk] Node 22 minimum excludes some users** → Production code works on Node 18+, but we set `engines: >=22` for consistency with tests. Trade-off accepted: Node 22 is current LTS, and the primary audience (AI agent users running Claude Code) will have modern Node.

**[Trade-off] No CONTRIBUTING.md or issue templates yet** → Keeps this change focused. Can be added in a follow-up change without blocking the open source launch.
