---
name: Change Context
description: How to discover and understand what to verify.
  Read when starting verification for a specific change or free-form query.
---

**IMPORTANT**: Do NOT put change-specific criteria or verification details in this file.
Knowledge files persist across verifications. Change-specific context belongs in the
session evidence, not here. This file is for reusable project-level discovery patterns.

## For OpenSpec Projects

List available changes:
```
openspec list --json
```

Get details for a specific change:
```
openspec show <change-name> --json
```

Read the change's specs for acceptance criteria. Spec names are usually descriptive
(e.g., `practice-session-ui`, `library-browser`). Read 2-3 relevant specs for navigation
and behavior context.

## For Free-Form Verification

When given a verification query (not a specific change):
1. Break the query into discrete, verifiable criteria
2. Assign descriptive names to each criterion
3. Discover more criteria as you explore the app
4. Keep criteria specific and verifiable via the interaction tool

## For Other Projects

If the project doesn't use OpenSpec, check:
- GitHub issues/PRs for acceptance criteria
- README.md or docs/ for feature descriptions
- Recent git commits for what changed

<!-- Agent: add project-specific context discovery notes below -->
