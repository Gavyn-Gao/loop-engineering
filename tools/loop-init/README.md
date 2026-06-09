# loop-init

Scaffold loop engineering starters into your project by pattern and tool.

**npx @cobusgreyling/loop-init . --pattern daily-triage --tool grok** works immediately.

## Install & Run

```bash
npx @cobusgreyling/loop-init . --pattern daily-triage --tool grok
npx @cobusgreyling/loop-init . -p pr-babysitter -t claude
npx @cobusgreyling/loop-init . -p dependency-sweeper --dry-run
```

See [docs/RELEASE.md](../../docs/RELEASE.md) for npm publish tags. The published package bundles `starters/` and `templates/` from this monorepo.

After scaffolding, always run `npx @cobusgreyling/loop-audit . --suggest` and actually execute the first report-only loop to generate activity signals.

## Patterns

| Pattern | Default state file |
|---------|-------------------|
| `daily-triage` | `STATE.md` |
| `pr-babysitter` | `pr-babysitter-state.md` |
| `ci-sweeper` | `ci-sweeper-state.md` |
| `dependency-sweeper` | `dependency-sweeper-state.md` |
| `post-merge-cleanup` | `post-merge-state.md` |
| `changelog-drafter` | `changelog-drafter-state.md` |

L2 patterns (`ci-sweeper`, `dependency-sweeper`) also copy `minimal-fix` and `loop-verifier` templates when missing from the starter.

## Tools

- `grok` (default)
- `claude`
- `codex`

Falls back to Grok starter paths when a per-tool variant is not yet available.

## From this repo

```bash
cd tools/loop-init && npm ci && npm test
node dist/cli.js /path/to/project --pattern daily-triage --tool grok
```

Pair with `loop-audit` after scaffolding:

```bash
npx @cobusgreyling/loop-audit . --suggest
```