## Plain Text Output

### Requirements

1. All CLI commands output human-readable plain text by default
2. `--json` global flag switches to structured JSON envelope `{ok, command, data, error}`
3. Plain text format is designed for LLM agent consumption — concise, scannable, no unnecessary decoration
4. Error output in plain text mode prints to stderr with clear error message
5. The `--json` flag is registered on the root program and available to all subcommands
6. Each command has a plain text formatter; fallback renders key-value pairs
