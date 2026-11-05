import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

type SkillUsage = { codex: number; claude: number; weekly: Map<string, number> };
type Usage = Map<string, SkillUsage>;
type SkillDetectors = { pathPattern: RegExp; namePattern: RegExp | null };
type UsedSkill = { skill: string; codex: number; claude: number; total: number; weekly: Record<string, number> };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv: string[]) {
  const options = {
    skillsRoot: path.join(repoRoot, 'skills'),
    codexRoot: path.join(os.homedir(), '.codex', 'sessions'),
    claudeRoot: path.join(os.homedir(), '.claude', 'projects'),
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--skills-root' || arg === '--codex-root' || arg === '--claude-root') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 1;
      const resolved = path.resolve(value);
      if (arg === '--skills-root') options.skillsRoot = resolved;
      if (arg === '--codex-root') options.codexRoot = resolved;
      if (arg === '--claude-root') options.claudeRoot = resolved;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function listSkillNames(skillsRoot: string): string[] {
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Skills root not found: ${skillsRoot}`);
  }

  const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(skillsRoot, name, 'SKILL.md')))
    .sort();
}

function* walkJsonlFiles(root: string): Generator<string> {
  if (!fs.existsSync(root)) return;

  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        yield fullPath;
      }
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSkillDetectors(skillNames: string[]): SkillDetectors {
  const pathPattern = /\/skills\/([A-Za-z0-9._-]+)\/SKILL\.md/g;
  const union = skillNames.map(escapeRegExp).join('|');
  const namePattern = union
    ? new RegExp(`(^|[^A-Za-z0-9_-])(${union})(?=$|[^A-Za-z0-9_-])`, 'g')
    : null;
  return { pathPattern, namePattern };
}

function detectSkillsFromText(text: string, detectors: SkillDetectors, knownSkills: Set<string>, allowNameMatch: boolean): string[] {
  if (!text) return [];
  const found = new Set<string>();

  detectors.pathPattern.lastIndex = 0;
  for (;;) {
    const match = detectors.pathPattern.exec(text);
    if (!match) break;
    if (knownSkills.has(match[1])) {
      found.add(match[1]);
    }
  }

  if (allowNameMatch && detectors.namePattern) {
    detectors.namePattern.lastIndex = 0;
    for (;;) {
      const match = detectors.namePattern.exec(text);
      if (!match) break;
      const skill = match[2];
      if (knownSkills.has(skill)) {
        found.add(skill);
      }
    }
  }

  return [...found];
}

function normalizeTimestampMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isoWeekKey(timestampMs: number | null): string | null {
  if (timestampMs == null) return null;
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return null;

  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7,
    );
  const year = target.getUTCFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function markUsage(usage: Usage, source: "codex" | "claude", skills: string[], weekKey: string | null): void {
  for (const skill of skills) {
    const record = usage.get(skill);
    if (!record) continue;
    record[source] += 1;
    if (weekKey) {
      const current = record.weekly.get(weekKey) ?? 0;
      record.weekly.set(weekKey, current + 1);
    }
  }
}

async function scanCodex(codexRoot: string, usage: Usage, detectors: SkillDetectors, knownSkills: Set<string>) {
  let files = 0;
  let lines = 0;
  for (const filePath of walkJsonlFiles(codexRoot)) {
    files += 1;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      lines += 1;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }
      if (row?.type !== 'response_item') continue;
      const payload = row.payload;
      if (!payload || payload.type !== 'function_call') continue;

      const name = typeof payload.name === 'string' ? payload.name : '';
      const args =
        typeof payload.arguments === 'string'
          ? payload.arguments
          : JSON.stringify(payload.arguments ?? {});
      const text = `${name}\n${args}`;
      const skills = detectSkillsFromText(text, detectors, knownSkills, name === 'Skill');
      const weekKey = isoWeekKey(normalizeTimestampMs(row.timestamp));
      markUsage(usage, 'codex', skills, weekKey);
    }
  }
  return { files, lines };
}

async function scanClaude(claudeRoot: string, usage: Usage, detectors: SkillDetectors, knownSkills: Set<string>) {
  let files = 0;
  let lines = 0;
  for (const filePath of walkJsonlFiles(claudeRoot)) {
    files += 1;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      lines += 1;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }

      if (row?.type !== 'assistant') continue;
      const content = row?.message?.content;
      if (!Array.isArray(content)) continue;

      for (const block of content) {
        if (!block || block.type !== 'tool_use') continue;
        const toolName = typeof block.name === 'string' ? block.name : '';
        const inputText = JSON.stringify(block.input ?? {});
        const text = `${toolName}\n${inputText}`;
        const allowNameMatch = /skill/i.test(toolName);
        const skills = detectSkillsFromText(text, detectors, knownSkills, allowNameMatch);
        const weekKey = isoWeekKey(normalizeTimestampMs(row.timestamp));
        markUsage(usage, 'claude', skills, weekKey);
      }
    }
  }
  return { files, lines };
}

function summarize(usage: Usage) {
  const used: UsedSkill[] = [];
  const unused: string[] = [];
  for (const [skill, record] of usage.entries()) {
    const total = record.codex + record.claude;
    const weekly = Object.fromEntries(
      [...record.weekly.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
    if (total > 0) {
      used.push({ skill, codex: record.codex, claude: record.claude, total, weekly });
    } else {
      unused.push(skill);
    }
  }
  used.sort((a, b) => b.total - a.total || a.skill.localeCompare(b.skill));
  unused.sort();
  return { used, unused };
}

function buildHistogramBar(value: number, maxValue: number, width = 24): string {
  if (value <= 0 || maxValue <= 0) return '';
  const filled = Math.max(1, Math.round((value / maxValue) * width));
  return '#'.repeat(filled);
}

function renderWeeklyHistogram(usage: Usage, skillNames: string[]): void {
  process.stdout.write('\nPer-week skill histogram (ISO weeks):\n');
  for (const skill of skillNames) {
    const record = usage.get(skill);
    if (!record) continue;
    const total = record.codex + record.claude;
    process.stdout.write(`\n${skill} (${total})\n`);
    const weeklyEntries = [...record.weekly.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (weeklyEntries.length === 0) {
      process.stdout.write('  - no usage\n');
      continue;
    }
    const maxWeek = Math.max(...weeklyEntries.map(([, count]) => count));
    for (const [week, count] of weeklyEntries) {
      const bar = buildHistogramBar(count, maxWeek);
      process.stdout.write(`  ${week} ${String(count).padStart(4, ' ')} | ${bar}\n`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const skillNames = listSkillNames(options.skillsRoot);
  const usage: Usage = new Map(
    skillNames.map((name) => [name, { codex: 0, claude: 0, weekly: new Map<string, number>() }]),
  );
  const knownSkills = new Set(skillNames);
  const detectors = createSkillDetectors(skillNames);

  const [codexStats, claudeStats] = await Promise.all([
    scanCodex(options.codexRoot, usage, detectors, knownSkills),
    scanClaude(options.claudeRoot, usage, detectors, knownSkills),
  ]);
  const { used, unused } = summarize(usage);

  if (options.json) {
    const output = {
      skillsRoot: options.skillsRoot,
      codexRoot: options.codexRoot,
      claudeRoot: options.claudeRoot,
      totals: {
        skills: skillNames.length,
        used: used.length,
        unused: unused.length,
      },
      scanned: {
        codexFiles: codexStats.files,
        codexLines: codexStats.lines,
        claudeFiles: claudeStats.files,
        claudeLines: claudeStats.lines,
      },
      used,
      unused,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Skills analyzed: ${skillNames.length}\n`);
  process.stdout.write(
    `Codex logs: ${codexStats.files} files, ${codexStats.lines.toLocaleString()} lines\n`,
  );
  process.stdout.write(
    `Claude logs: ${claudeStats.files} files, ${claudeStats.lines.toLocaleString()} lines\n`,
  );
  process.stdout.write(`Used skills: ${used.length}\n`);
  process.stdout.write(`Unused skills: ${unused.length}\n\n`);

  process.stdout.write('Unused skill names:\n');
  for (const skill of unused) {
    process.stdout.write(`- ${skill}\n`);
  }
  renderWeeklyHistogram(usage, skillNames);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? String(error)}\n`);
  process.exit(1);
});
