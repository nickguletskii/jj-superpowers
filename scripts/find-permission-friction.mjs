#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PERMISSION_TEXT =
  /permission denied|operation not permitted|\bEPERM\b|requires approval|required approval|blocked by sandbox|command blocked|require_escalated|injection detected|prompt injection/i;

function parseArgs(argv) {
  const options = {
    codexRoot: path.join(os.homedir(), '.codex', 'sessions'),
    claudeRoot: path.join(os.homedir(), '.claude', 'projects'),
    json: false,
    limit: 5,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--limit') {
      const value = Number.parseInt(argv[i + 1], 10);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid --limit value: ${argv[i + 1]}`);
      }
      options.limit = value;
      i += 1;
      continue;
    }
    if (arg === '--codex-root' || arg === '--claude-root') {
      const value = argv[i + 1];
      if (!value) throw new Error(`Missing value for ${arg}`);
      const resolved = path.resolve(value);
      if (arg === '--codex-root') options.codexRoot = resolved;
      if (arg === '--claude-root') options.claudeRoot = resolved;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function* walkJsonlFiles(root) {
  if (!root || !fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
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

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function sampleText(text, max = 240) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}

function addSample(samples, key, value, limit) {
  if (limit === 0) return;
  if (samples[key].length < limit) samples[key].push(value);
}

function commandRiskReasons(command) {
  const reasons = [];
  const text = String(command ?? '');
  if (!text) return reasons;

  if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(text)) reasons.push('inline-env');
  if (/\bbash\s+-lc\b|\bsh\s+-c\b/.test(text)) reasons.push('shell-wrapper');
  if (/<<[-~]?\s*[A-Za-z0-9_'"-]+/.test(text)) reasons.push('heredoc');
  if (/\$\(|`/.test(text)) reasons.push('command-substitution');
  if (/[;&|<>]/.test(text)) reasons.push('shell-control-or-redirection');
  return [...new Set(reasons)];
}

function commandPrefix(command, length = 3) {
  return String(command ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, length);
}

function recordCommand(report, source, command, location, limit) {
  if (!command) return;
  const prefix = commandPrefix(command);
  if (prefix.length > 0) {
    const key = prefix.join('\u0000');
    const current = report.prefixCounts.get(key) ?? { prefix, count: 0 };
    current.count += 1;
    report.prefixCounts.set(key, current);
  }

  const reasons = commandRiskReasons(command);
  if (reasons.length === 0) return;
  report.counts.riskyCommands += 1;
  addSample(
    report.samples,
    'riskyCommands',
    { source, ...location, reasons, command: sampleText(command) },
    limit,
  );
}

function claudePermissionSample(filePath, lineNumber, text, recentCommand) {
  const sample = { file: filePath, line: lineNumber, text: sampleText(text) };
  if (!recentCommand?.command) return sample;
  return {
    ...sample,
    command: sampleText(recentCommand.command),
    commandFile: recentCommand.file,
    commandLine: recentCommand.line,
  };
}

function textFromClaudeContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (typeof block?.content === 'string') return block.content;
      if (typeof block?.text === 'string') return block.text;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

async function scanCodex(report, root, limit) {
  for (const filePath of walkJsonlFiles(root)) {
    report.totals.codexFiles += 1;
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber += 1;
      report.totals.codexLines += 1;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }
      if (row?.type !== 'response_item') continue;
      const payload = row.payload;
      if (payload?.type === 'function_call') {
        const args = parseMaybeJson(payload.arguments);
        const command = args.cmd ?? args.command;
        recordCommand(report, 'codex', command, { file: filePath, line: lineNumber }, limit);
        if (
          args.sandbox_permissions === 'require_escalated' ||
          args.sandboxPermissions === 'require_escalated' ||
          args.prefix_rule ||
          args.prefixRule ||
          args.justification
        ) {
          report.counts.codexEscalationRequests += 1;
          addSample(
            report.samples,
            'codexEscalationRequests',
            {
              file: filePath,
              line: lineNumber,
              command: sampleText(command),
              justification: sampleText(args.justification ?? ''),
              prefixRule: args.prefix_rule ?? args.prefixRule ?? null,
            },
            limit,
          );
        }
      }
      const output = String(payload?.output ?? '');
      const successfulOutput = /Process exited with code 0/.test(output);
      if (payload?.type === 'function_call_output' && !successfulOutput && PERMISSION_TEXT.test(output)) {
        report.counts.permissionErrors += 1;
        addSample(
          report.samples,
          'permissionErrors',
          { source: 'codex', file: filePath, line: lineNumber, text: sampleText(payload.output) },
          limit,
        );
      }
    }
  }
}

async function scanClaude(report, root, limit) {
  for (const filePath of walkJsonlFiles(root)) {
    report.totals.claudeFiles += 1;
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    let lineNumber = 0;
    let recentCommand = null;
    for await (const line of rl) {
      lineNumber += 1;
      report.totals.claudeLines += 1;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }

      const content = row?.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block?.type === 'tool_use') {
            const command = block.input?.command ?? block.input?.cmd;
            recordCommand(report, 'claude', command, { file: filePath, line: lineNumber }, limit);
            if (command) {
              recentCommand = { command, file: filePath, line: lineNumber };
            }
          }
          if (block?.type === 'tool_result') {
            const text = textFromClaudeContent([block]);
            if (PERMISSION_TEXT.test(text)) {
              report.counts.claudePermissionMessages += 1;
              addSample(
                report.samples,
                'claudePermissionMessages',
                claudePermissionSample(filePath, lineNumber, text, recentCommand),
                limit,
              );
            }
          }
        }
      }

      const text = textFromClaudeContent(content);
      if (
        row?.type !== 'assistant' &&
        !Array.isArray(content) &&
        PERMISSION_TEXT.test(text)
      ) {
        report.counts.claudePermissionMessages += 1;
        addSample(
          report.samples,
          'claudePermissionMessages',
          claudePermissionSample(filePath, lineNumber, text, recentCommand),
          limit,
        );
      }
    }
  }
}

export async function analyzeLogs(options = {}) {
  const report = {
    roots: {
      codex: options.codexRoot ?? path.join(os.homedir(), '.codex', 'sessions'),
      claude: options.claudeRoot ?? path.join(os.homedir(), '.claude', 'projects'),
    },
    totals: {
      codexFiles: 0,
      codexLines: 0,
      claudeFiles: 0,
      claudeLines: 0,
    },
    counts: {
      codexEscalationRequests: 0,
      permissionErrors: 0,
      claudePermissionMessages: 0,
      riskyCommands: 0,
    },
    samples: {
      codexEscalationRequests: [],
      permissionErrors: [],
      claudePermissionMessages: [],
      riskyCommands: [],
    },
    prefixCounts: new Map(),
    repeatedPrefixes: [],
  };

  const limit = options.limit ?? 5;
  await scanCodex(report, report.roots.codex, limit);
  await scanClaude(report, report.roots.claude, limit);

  report.repeatedPrefixes = [...report.prefixCounts.values()]
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count || a.prefix.join(' ').localeCompare(b.prefix.join(' ')))
    .slice(0, limit);
  delete report.prefixCounts;

  return report;
}

function renderText(report) {
  const lines = [];
  lines.push('Permission friction report');
  lines.push('');
  lines.push(`Codex files: ${report.totals.codexFiles}, lines: ${report.totals.codexLines}`);
  lines.push(`Claude files: ${report.totals.claudeFiles}, lines: ${report.totals.claudeLines}`);
  lines.push('');
  for (const [key, value] of Object.entries(report.counts)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push('');
  if (report.repeatedPrefixes.length > 0) {
    lines.push('Repeated command prefixes:');
    for (const entry of report.repeatedPrefixes) {
      lines.push(`- ${entry.count}x ${entry.prefix.join(' ')}`);
    }
  }
  for (const [key, samples] of Object.entries(report.samples)) {
    if (samples.length === 0) continue;
    lines.push('');
    lines.push(`${key} samples:`);
    for (const sample of samples) {
      const details = [];
      if (sample.command) details.push(sample.command);
      if (sample.text) details.push(sample.text);
      lines.push(`- ${sample.file}:${sample.line} ${details.join(' | ')}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await analyzeLogs(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(renderText(report));
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

export { commandRiskReasons, parseArgs, repoRoot };
