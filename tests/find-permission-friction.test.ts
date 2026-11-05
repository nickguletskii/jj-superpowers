import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { analyzeLogs } from '../scripts/find-permission-friction.ts';

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

test('analyzes Codex permission requests and risky shell commands', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'permission-friction-codex-'));
  const codexRoot = path.join(root, 'codex');
  const claudeRoot = path.join(root, 'claude');

  writeJsonl(path.join(codexRoot, 'session.jsonl'), [
    {
      type: 'response_item',
      payload: {
        type: 'function_call',
        name: 'exec_command',
        arguments: JSON.stringify({
          cmd: 'FOO=bar bash -lc "cargo test && echo done"',
          sandbox_permissions: 'require_escalated',
          justification: 'Need network access',
          prefix_rule: ['cargo', 'test'],
        }),
      },
    },
    {
      type: 'response_item',
      payload: {
        type: 'function_call_output',
        output: 'Permission denied while writing cache',
      },
    },
    {
      type: 'response_item',
      payload: {
        type: 'function_call',
        name: 'exec_command',
        arguments: JSON.stringify({
          cmd: 'FOO=bar bash -lc "cargo test --help"',
        }),
      },
    },
  ]);

  const report = await analyzeLogs({ codexRoot, claudeRoot, limit: 10 });

  assert.equal(report.totals.codexFiles, 1);
  assert.equal(report.counts.codexEscalationRequests, 1);
  assert.equal(report.counts.permissionErrors, 1);
  assert.equal(report.counts.riskyCommands, 2);
  assert.match(report.samples.riskyCommands[0].command, /FOO=bar/);
  assert.deepEqual(report.repeatedPrefixes[0].prefix, ['FOO=bar', 'bash', '-lc']);
});

test('analyzes Claude permission and injection-style messages', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'permission-friction-claude-'));
  const codexRoot = path.join(root, 'codex');
  const claudeRoot = path.join(root, 'claude');

  writeJsonl(path.join(claudeRoot, 'session.jsonl'), [
    {
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            name: 'Bash',
            input: { command: 'node <<EOF\nconsole.log("hi")\nEOF;SOME_ENV_EXIT=$?' },
          },
        ],
      },
    },
    {
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            content: 'Command blocked: possible prompt injection detected',
            is_error: true,
          },
        ],
      },
    },
  ]);

  const report = await analyzeLogs({ codexRoot, claudeRoot, limit: 10 });

  assert.equal(report.totals.claudeFiles, 1);
  assert.equal(report.counts.claudePermissionMessages, 1);
  assert.equal(report.counts.riskyCommands, 1);
  assert.match(report.samples.claudePermissionMessages[0].command, /SOME_ENV_EXIT/);
  assert.equal(report.samples.claudePermissionMessages[0].commandLine, 1);
  assert.match(report.samples.claudePermissionMessages[0].text, /prompt injection/i);
  assert.match(report.samples.riskyCommands[0].command, /SOME_ENV_EXIT/);
});
