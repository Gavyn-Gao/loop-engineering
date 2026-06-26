import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
export async function fileExists(p) {
    try {
        await stat(p);
        return true;
    }
    catch {
        return false;
    }
}
export async function resolveProjectRoot(hint) {
    if (hint)
        return path.resolve(hint);
    return process.env.LOOP_PROJECT_ROOT
        ? path.resolve(process.env.LOOP_PROJECT_ROOT)
        : process.cwd();
}
export async function readFileIfExists(filePath) {
    try {
        return await readFile(filePath, 'utf8');
    }
    catch {
        return null;
    }
}
export async function loadRegistry(root) {
    const registryPath = path.join(root, 'patterns', 'registry.yaml');
    const content = await readFileIfExists(registryPath);
    if (!content)
        return null;
    const { parse } = await import('yaml');
    return parse(content);
}
export async function loadPatternDoc(root, patternId) {
    const filePath = path.join(root, 'patterns', `${patternId}.md`);
    return readFileIfExists(filePath);
}
export async function listSkills(root) {
    const skillDirs = [
        path.join(root, 'skills'),
        path.join(root, '.grok', 'skills'),
        path.join(root, '.claude', 'skills'),
        path.join(root, '.codex', 'skills'),
    ];
    const results = [];
    for (const dir of skillDirs) {
        if (!(await fileExists(dir)))
            continue;
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const e of entries) {
                if (!e.isDirectory())
                    continue;
                const skillMd = path.join(dir, e.name, 'SKILL.md');
                const content = await readFileIfExists(skillMd);
                if (content) {
                    results.push({ name: e.name, path: skillMd, content });
                }
            }
        }
        catch { /* dir unreadable */ }
    }
    return results;
}
export async function loadSkill(root, skillName) {
    const skills = await listSkills(root);
    return skills.find(s => s.name === skillName) ?? null;
}
export async function loadState(root, stateFile) {
    const target = stateFile ?? 'STATE.md';
    return readFileIfExists(path.join(root, target));
}
export async function listStateFiles(root) {
    const candidates = [
        'STATE.md',
        'pr-babysitter-state.md',
        'ci-sweeper-state.md',
        'post-merge-state.md',
        'dependency-sweeper-state.md',
        'changelog-drafter-state.md',
        'issue-triage-state.md',
    ];
    const found = [];
    for (const f of candidates) {
        if (await fileExists(path.join(root, f)))
            found.push(f);
    }
    return found;
}
export async function loadLoopConfig(root) {
    return readFileIfExists(path.join(root, 'LOOP.md'));
}
export async function loadBudget(root) {
    return readFileIfExists(path.join(root, 'loop-budget.md'));
}
export async function loadRunLog(root) {
    return readFileIfExists(path.join(root, 'loop-run-log.md'));
}
export async function loadSafetyDoc(root) {
    for (const f of ['docs/safety.md', 'safety.md', 'SECURITY.md']) {
        const content = await readFileIfExists(path.join(root, f));
        if (content)
            return content;
    }
    return null;
}
export async function listPatternDocs(root) {
    const patternsDir = path.join(root, 'patterns');
    if (!(await fileExists(patternsDir)))
        return [];
    try {
        const entries = await readdir(patternsDir);
        return entries
            .filter(e => e.endsWith('.md') && e !== 'README.md')
            .map(e => e.replace('.md', ''));
    }
    catch {
        return [];
    }
}
