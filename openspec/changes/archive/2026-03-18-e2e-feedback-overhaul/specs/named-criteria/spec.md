## Named Criteria

### Requirements

1. Evidence commands (`step`, `screenshot`, `judge`, `fix`) accept `--criterion <name>` (string) instead of `--ac <number>` (integer)
2. Criterion names are kebab-case descriptive labels (e.g., "settings-translated", "library-search-works")
3. Evidence entries store `criterion: "<name>"` instead of `ac: <number>`
4. `evidence` summary groups by criterion name
5. Report renders criterion names as section headers instead of "AC 1", "AC 2"
6. `judge` command requires `--criterion` (mandatory)
7. `step`, `screenshot`, `fix` accept `--criterion` (optional — entries without criterion go to general/unassociated)
