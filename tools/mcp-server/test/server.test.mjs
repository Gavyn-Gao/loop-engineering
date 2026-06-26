import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  resolveProjectRoot,
  loadRegistry,
  listSkills,
  loadSkill,
  loadState,
  listStateFiles,
  loadLoopConfig,
  loadBudget,
  loadRunLog,
  loadSafetyDoc,
  listPatternDocs,
  loadPatternDoc,
} from '../dist/resolver.js';

let tmpRoot;

async function setup() {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'mcp-test-'));

  // patterns/registry.yaml
  await mkdir(path.join(tmpRoot, 'patterns'), { recursive: true });
  await writeFile(
    path.join(tmpRoot, 'patterns', 'registry.yaml'),
    `patterns:
  - id: daily-triage
    name: Daily Triage
    file: daily-triage.md
    goal: Prioritized morning scan
    cadence: 1d-2h
    risk: low
    tools: [grok, claude-code]
    skills: [loop-triage, minimal-fix]
    state: STATE.md
    phases: [report, act-small-wins, escalate]
    human_gates: [design-decisions]
    starter: starters/minimal-loop
    week_one_mode: L1
    token_cost: low
    cost:
      tokens_noop: 5000
      tokens_report: 50000
      tokens_action: 200000
      suggested_daily_cap: 100000
      early_exit_required: false
`,
  );

  // Pattern doc
  await writeFile(
    path.join(tmpRoot, 'patterns', 'daily-triage.md'),
    '# Daily Triage\n\n## Scheduling\nRun once per day.\n\n## Required Skills\nloop-triage\n\n## Verification Strategy\nmaker/checker via loop-verifier\n',
  );

  // Skills
  await mkdir(path.join(tmpRoot, 'skills', 'loop-triage'), { recursive: true });
  await writeFile(
    path.join(tmpRoot, 'skills', 'loop-triage', 'SKILL.md'),
    '---\nname: loop-triage\ndescription: Triage skill\nuser_invocable: true\n---\n\n# Loop Triage\nYou are a triage agent.',
  );

  // State files
  await writeFile(
    path.join(tmpRoot, 'STATE.md'),
    '# Loop State\n\nLast run: 2026-06-20T08:00Z\n\n## High Priority\n- Fix CI\n',
  );

  // LOOP.md
  await writeFile(
    path.join(tmpRoot, 'LOOP.md'),
    '# Loop Config\n\n## Budget\nMax tokens/day: 100k\nKill switch: loop-pause-all\n',
  );

  // loop-budget.md
  await writeFile(
    path.join(tmpRoot, 'loop-budget.md'),
    '# Loop Budget\n\nDaily cap: 100k tokens\n',
  );

  // loop-run-log.md
  await writeFile(
    path.join(tmpRoot, 'loop-run-log.md'),
    '# Run Log\n\n- 2026-06-20T08:00Z: daily-triage — report — 45k tokens\n',
  );

  // Safety doc
  await mkdir(path.join(tmpRoot, 'docs'), { recursive: true });
  await writeFile(
    path.join(tmpRoot, 'docs', 'safety.md'),
    '# Safety\n\n## Path Denylists\n- .env\n- credentials\n',
  );

  return tmpRoot;
}

async function cleanup() {
  if (tmpRoot) await rm(tmpRoot, { recursive: true, force: true });
}

// ── Tests ──────────────────────────────────────────────────────────

test('resolveProjectRoot uses LOOP_PROJECT_ROOT env var', async () => {
  const orig = process.env.LOOP_PROJECT_ROOT;
  process.env.LOOP_PROJECT_ROOT = '/some/path';
  const root = await resolveProjectRoot();
  assert.ok(root.includes('some'));
  if (orig !== undefined) process.env.LOOP_PROJECT_ROOT = orig;
  else delete process.env.LOOP_PROJECT_ROOT;
});

test('resolveProjectRoot uses explicit hint over env', async () => {
  const root = await resolveProjectRoot('/explicit/path');
  assert.ok(root.includes('explicit'));
});

test('loadRegistry parses YAML correctly', async () => {
  const root = await setup();
  try {
    const registry = await loadRegistry(root);
    assert.ok(registry);
    assert.equal(registry.patterns.length, 1);
    assert.equal(registry.patterns[0].id, 'daily-triage');
    assert.equal(registry.patterns[0].cost.tokens_noop, 5000);
  } finally {
    await cleanup();
  }
});

test('loadRegistry returns null when missing', async () => {
  const empty = await mkdtemp(path.join(tmpdir(), 'mcp-empty-'));
  try {
    const result = await loadRegistry(empty);
    assert.equal(result, null);
  } finally {
    await rm(empty, { recursive: true, force: true });
  }
});

test('listSkills finds skills directories', async () => {
  const root = await setup();
  try {
    const skills = await listSkills(root);
    assert.ok(skills.length >= 1);
    const names = skills.map(s => s.name);
    assert.ok(names.includes('loop-triage'));
  } finally {
    await cleanup();
  }
});

test('loadSkill returns content for existing skill', async () => {
  const root = await setup();
  try {
    const skill = await loadSkill(root, 'loop-triage');
    assert.ok(skill);
    assert.ok(skill.content.includes('triage'));
  } finally {
    await cleanup();
  }
});

test('loadSkill returns null for missing skill', async () => {
  const root = await setup();
  try {
    const skill = await loadSkill(root, 'nonexistent');
    assert.equal(skill, null);
  } finally {
    await cleanup();
  }
});

test('loadState reads STATE.md', async () => {
  const root = await setup();
  try {
    const state = await loadState(root);
    assert.ok(state);
    assert.ok(state.includes('Fix CI'));
  } finally {
    await cleanup();
  }
});

test('listStateFiles finds existing state files', async () => {
  const root = await setup();
  try {
    const files = await listStateFiles(root);
    assert.ok(files.includes('STATE.md'));
  } finally {
    await cleanup();
  }
});

test('loadLoopConfig reads LOOP.md', async () => {
  const root = await setup();
  try {
    const config = await loadLoopConfig(root);
    assert.ok(config);
    assert.ok(config.includes('Budget'));
  } finally {
    await cleanup();
  }
});

test('loadBudget reads loop-budget.md', async () => {
  const root = await setup();
  try {
    const budget = await loadBudget(root);
    assert.ok(budget);
    assert.ok(budget.includes('100k'));
  } finally {
    await cleanup();
  }
});

test('loadRunLog reads loop-run-log.md', async () => {
  const root = await setup();
  try {
    const log = await loadRunLog(root);
    assert.ok(log);
    assert.ok(log.includes('daily-triage'));
  } finally {
    await cleanup();
  }
});

test('loadSafetyDoc reads docs/safety.md', async () => {
  const root = await setup();
  try {
    const safety = await loadSafetyDoc(root);
    assert.ok(safety);
    assert.ok(safety.includes('Denylists'));
  } finally {
    await cleanup();
  }
});

test('listPatternDocs finds .md files in patterns/', async () => {
  const root = await setup();
  try {
    const docs = await listPatternDocs(root);
    assert.ok(docs.includes('daily-triage'));
  } finally {
    await cleanup();
  }
});

test('loadPatternDoc returns content', async () => {
  const root = await setup();
  try {
    const doc = await loadPatternDoc(root, 'daily-triage');
    assert.ok(doc);
    assert.ok(doc.includes('# Daily Triage'));
  } finally {
    await cleanup();
  }
});

test('loadPatternDoc returns null for missing pattern', async () => {
  const root = await setup();
  try {
    const doc = await loadPatternDoc(root, 'nonexistent');
    assert.equal(doc, null);
  } finally {
    await cleanup();
  }
});
