## Why

Real-world testing revealed that the proofrun agent produces incomplete verification. When verifying a large change (15 sounds, 44 variants, 4+ entry points, 17 languages), the agent only created 6 criteria covering 2 sounds through 1 entry point. The reviewer explicitly requested broader coverage in the top-level feedback comment, but the agent ignored it — focusing only on per-criterion rejections.

Root causes:
1. No structured planning step — the agent picks criteria ad-hoc and starts executing immediately
2. No completeness gate — nothing tells the agent it missed spec coverage
3. Top-level feedback comments are not actioned — the "Handle Feedback" instruction only references per-criterion rejections
4. CLI provides no guardrails — no warnings for missing screenshots, unfilled knowledge placeholders, or unsafe device cleanup

## What Changes

- **New `proofrun plan` command**: Agent creates a verification plan mapping spec acceptance criteria → proofrun criteria → test cases. Must complete the plan before recording evidence. `plan check` shows coverage gaps.
- **Screenshot warning on `proofrun judge`**: CLI warns if no screenshot exists for the criterion being judged.
- **Placeholder warning on `proofrun session stop`**: CLI scans knowledge files for unfilled `<!-- Agent:` placeholders and warns.
- **SKILL.md workflow updates**: Insert plan phase between environment setup and execution. Fix feedback handling to read `top_level_comment`. Fix device shutdown to check lock status first. Strengthen screenshot requirement.
- **Knowledge template updates**: `devices.md` adds device cleanup instruction. Minor template improvements.

## Capabilities

### New Capabilities
- `plan-command`: CLI command for creating, listing, and checking verification plans within a session
- `cli-guardrails`: Warnings on judge (missing screenshots) and session stop (unfilled knowledge placeholders)

### Modified Capabilities

## Impact

- `src/commands/plan.js` — new command file
- `src/commands/session.js` — session stop gains placeholder scan
- `src/commands/judge.js` — judge gains screenshot check
- `src/cli.js` — register plan and update help text
- `skills/proofrun/SKILL.md` — workflow restructure (plan phase, feedback handling, device cleanup, screenshot enforcement)
- `templates/knowledge/devices.md` — device cleanup section
