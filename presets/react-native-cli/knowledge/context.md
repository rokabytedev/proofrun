---
name: Change Context
description: How to discover and understand what to verify. Read when starting verification.
---

## Finding What to Verify

No structured spec source configured by default. To understand what to verify:
- Check recent git commits: `git log --oneline -20`
- Read changed files: `git diff main --name-only`
- Ask the user for acceptance criteria if unclear

## For Free-Form Verification

When given a verification query (not a specific change):
1. Break the query into discrete, verifiable criteria
2. Assign AC numbers to each criterion
3. Discover more criteria as you explore the app

<!-- Agent: add project-specific context discovery notes below -->
