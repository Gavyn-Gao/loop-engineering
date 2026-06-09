# loop-audit

CLI that scores a project's **Loop Readiness** (0–100) and suggests next steps.

**npx @cobusgreyling/loop-audit . --suggest** works immediately (published package).

## Install & Run

**npm (recommended):**

```bash
npx @cobusgreyling/loop-audit .
npx @cobusgreyling/loop-audit . --suggest
```

**From this repo:**

```bash
cd tools/loop-audit
npm install
npm run build
node dist/cli.js /path/to/your/project
```

## Before/after demo

See scores climb from empty → L1 starter → L2 verifier:

```bash
bash scripts/before-after-demo.sh
```

## Options

```bash
loop-audit .              # human-readable (default)
loop-audit . --json       # machine-readable
loop-audit . --md         # markdown report
loop-audit . --suggest    # copy-from-template commands + activity tips (all tools)
```

Exit code `2` if score < 40 (useful for CI gates once your project is loop-ready).

## Publish to npm

Maintainers:

```bash
cd tools/loop-audit
npm run build
npm publish --access public
```

## Signals Checked (v1.4+)

| Signal                  | Notes |
|-------------------------|-------|
| State file              | STATE.md or pattern-specific |
| Triage skill            | loop-triage / ci-triage / pr-review-triage etc. |
| Verifier skill          | maker/checker split (skills or Claude/Codex agents) |
| LOOP.md / config        | Cadence, limits, handoff |
| AGENTS.md / CLAUDE.md   | Project conventions |
| Safety docs             | safety.md + LOOP.md mentions of gates |
| .github/ + workflows    | Dogfooding / automation |
| MCP / connectors        | Mentions or config files |
| Worktree evidence       | Isolation patterns in docs |
| patterns/registry.yaml  | Machine index for tooling |
| **loopActivity (new)**  | **Dynamic proof**: "Last run" timestamps in state, loop-related git commits, scheduled workflows, run logs. This is what separates "configured on paper" from "actually running loops". L3 now requires it. |

## Levels

| Level | Meaning |
|-------|---------|
| L0 | Draft — document intent |
| L1 | Report-only loops |
| L2 | Assisted auto-fix with verifier |
| L3 | Unattended-capable (with human gates) |

See [docs/loop-design-checklist.md](../../docs/loop-design-checklist.md).