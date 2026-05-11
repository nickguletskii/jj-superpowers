import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { SuperpowersPlugin } from '../.opencode/plugins/superpowers.js';

const FULL_SKILL_MARKER = 'Below is the full content of your';
const FLOWCHART_MARKER = 'digraph skill_flow';
const ORCHESTRATOR_MARKER = 'orchestrator sessions';
const SUBAGENT_MARKER = 'subagent sessions';
const MAINTAINER_MARKER = 'notify jj-superpowers maintainers';
const PROVIDER_GUIDANCE_MARKER = 'provider system prompts or model guidance';

function decodeHookContext(output) {
  const parsed = JSON.parse(output);
  return (
    parsed.additional_context
    ?? parsed.additionalContext
    ?? parsed.hookSpecificOutput?.additionalContext
    ?? ''
  );
}

test('session-start hook injects a compact bootstrap instead of full using-superpowers', () => {
  const result = spawnSync('bash', ['./hooks/session-start'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  assert.ok(result.stdout, result.stderr || result.error?.message);
  const context = decodeHookContext(result.stdout);

  assert.match(context, /You have jj-superpowers/);
  assert.match(context, new RegExp(ORCHESTRATOR_MARKER));
  assert.match(context, new RegExp(SUBAGENT_MARKER));
  assert.match(context, new RegExp(MAINTAINER_MARKER));
  assert.match(context, new RegExp(PROVIDER_GUIDANCE_MARKER));
  assert.doesNotMatch(context, new RegExp(FULL_SKILL_MARKER));
  assert.doesNotMatch(context, new RegExp(FLOWCHART_MARKER));
  assert.ok(context.length < 1200, `bootstrap was ${context.length} characters`);
});

test('OpenCode plugin injects a compact bootstrap instead of full using-superpowers', async () => {
  const plugin = await SuperpowersPlugin({});
  const output = {
    messages: [
      {
        info: { role: 'user' },
        parts: [{ type: 'text', text: 'hello' }],
      },
    ],
  };

  await plugin['experimental.chat.messages.transform']({}, output);
  const context = output.messages[0].parts[0].text;

  assert.match(context, /You have jj-superpowers/);
  assert.match(context, new RegExp(ORCHESTRATOR_MARKER));
  assert.match(context, new RegExp(SUBAGENT_MARKER));
  assert.match(context, new RegExp(MAINTAINER_MARKER));
  assert.match(context, new RegExp(PROVIDER_GUIDANCE_MARKER));
  assert.doesNotMatch(context, /ALREADY LOADED/);
  assert.doesNotMatch(context, new RegExp(FLOWCHART_MARKER));
  assert.ok(context.length < 1400, `bootstrap was ${context.length} characters`);
});
