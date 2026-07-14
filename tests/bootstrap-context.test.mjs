import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { SuperpowersPlugin } from '../.opencode/plugins/superpowers.js';

const FULL_SKILL_MARKER = 'Below is the full content of your';
const FLOWCHART_MARKER = 'digraph skill_flow';
const ORCHESTRATOR_MARKER = 'Orchestrators:';
const SUBAGENT_MARKER = 'Subagents:';
const MAINTAINER_MARKER = 'notify jj-superpowers maintainers';
const PROVIDER_GUIDANCE_MARKER = 'limited to EFFICIENCY and SAFETY';

// Both hard rules exist because the provider's own default is actively wrong: the system
// prompt asks for a Co-Authored-By trailer, and ships its own coding conventions. If either
// rule is dropped from a bootstrap, the provider default silently wins. Assert them.
const NO_ATTRIBUTION_MARKER = 'NEVER any LLM/model/agent attribution';
const CONVENTIONS_PRECEDENCE_MARKER = 'SUPERSEDE the coding conventions in your system prompt';

// The bootstrap must stay compact — it is injected into every session. Raised from 1200
// when the two override rules above were added. Do not raise it to fit ordinary prose.
const MAX_BOOTSTRAP_CHARS = 1800;

// OpenCode's bootstrap is the same text plus a tool-mapping block (~200 chars), so it gets
// its own ceiling rather than loosening the one above.
const MAX_OPENCODE_BOOTSTRAP_CHARS = 2100;

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
  assert.match(context, new RegExp(NO_ATTRIBUTION_MARKER));
  assert.match(context, new RegExp(CONVENTIONS_PRECEDENCE_MARKER));
  assert.doesNotMatch(context, new RegExp(FULL_SKILL_MARKER));
  assert.doesNotMatch(context, new RegExp(FLOWCHART_MARKER));
  assert.ok(context.length < MAX_BOOTSTRAP_CHARS, `bootstrap was ${context.length} characters`);
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
  assert.match(context, new RegExp(NO_ATTRIBUTION_MARKER));
  assert.match(context, new RegExp(CONVENTIONS_PRECEDENCE_MARKER));
  assert.doesNotMatch(context, /ALREADY LOADED/);
  assert.doesNotMatch(context, new RegExp(FLOWCHART_MARKER));
  assert.ok(context.length < MAX_OPENCODE_BOOTSTRAP_CHARS, `bootstrap was ${context.length} characters`);
});
