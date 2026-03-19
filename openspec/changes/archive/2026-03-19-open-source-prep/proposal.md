## Why

Proofrun is ready for public release but the repository lacks open source essentials: the README is CLI-centric instead of agent-first, there's no CI, no automated changelog/release pipeline, no npm package published, and the GitHub repo has no description or topics. These gaps make the project harder to discover, trust, and adopt.

## What Changes

- **README.md rewrite**: Agent-first positioning. Lead with the skill (not the CLI). Philosophy section: "the agent is smart, the tool is dumb." Badges for npm version, license, CI status, Node.js version. CLI commands become a secondary reference section. Placeholder for demo report link.
- **GitHub Actions CI**: Test workflow running on push/PR across Node 18, 20, 22 matrix. Enables "tests passing" badge.
- **GitHub Actions release-please**: Automated changelog generation, version bumping, GitHub release creation, and npm publishing — all triggered by merging a release PR. Uses conventional commit prefixes already in use.
- **CHANGELOG.md**: Bootstrapped with retroactive entries for v0.1.0 and v0.2.0. Future entries managed entirely by release-please.
- **`.npmignore`**: Exclude `*.test.js` files from the npm package (currently 25% of package size is test code).
- **`package.json` updates**: Agent-first description, `engines` field for Node.js version requirement, updated keywords.
- **GitHub repo metadata**: Set description, topics, and homepage URL via `gh` CLI.

## Capabilities

### New Capabilities

None. This change introduces no new behavioral capabilities — it's packaging, CI, and documentation.

### Modified Capabilities

None. No spec-level behavior changes.

## Impact

- **Files created**: `.github/workflows/ci.yml`, `.github/workflows/release-please.yml`, `.npmignore`, `CHANGELOG.md`
- **Files modified**: `README.md`, `package.json`
- **External systems**: GitHub Actions (new workflows), npm registry (first publish — manual one-time step by maintainer, then automated), GitHub repo settings (description, topics)
- **Dependencies**: None added. release-please is a GitHub Action, not a project dependency.
