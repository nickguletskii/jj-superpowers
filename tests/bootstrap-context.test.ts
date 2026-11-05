import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import superpowers from '../.opencode/plugins/superpowers/index.ts';
import type { Plugin } from '@opencode/plugin';

const FULL_SKILL_MARKER = 'Below is the full content of your';
const FLOWCHART_MARKER = 'digraph skill_flow';
const ORCHESTRATOR_MARKER = 'Orchestrators:';
const SUBAGENT_MARKER = 'Subagents:';
const MAINTAINER_MARKER = 'notify jj-superpowers maintainers';
const PROVIDER_GUIDANCE_MARKER = 'Defer to your provider only on efficiency and safety';

// Both hard rules exist because the provider's own default is actively wrong: the system
// prompt asks for a Co-Authored-By trailer, and ships its own coding conventions. If either
// rule is dropped from a bootstrap, the provider default silently wins. Assert them.
const NO_ATTRIBUTION_MARKER = 'no LLM/model/agent attribution of any kind';
const CONVENTIONS_PRECEDENCE_MARKER = 'override the coding conventions in your system prompt';

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

type SkillFixture = {
  id: string;
  name: string;
  path: string;
  description: string;
  content: string;
};
type AgentFixture = {
  name?: string;
  description?: string;
  mode?: string;
  system?: string;
  permissions: { action: string; resource: string; effect: string }[];
};
type ContextFixture = {
  system: { type: string; text: string }[];
  messages: unknown[];
};

async function setupOpenCode() {
  const existingSkill: SkillFixture = { id: 'brainstorming', name: 'brainstorming', path: '/local/SKILL.md', description: 'Local skill', content: 'Keep this skill' };
  const existingAgent: AgentFixture = { description: 'Local implementer', system: 'Keep this agent', permissions: [] };
  const skills = new Map<string, SkillFixture>([['brainstorming', existingSkill]]);
  const agents = new Map<string, AgentFixture>([['sdd-implementer', existingAgent]]);
  const hooks = new Map<string, (event: ContextFixture) => void | Promise<void>>();
  const context = {
    skill: {
      async transform(transform: (editor: { get(id: string): SkillFixture | undefined; add(skill: SkillFixture): void }) => void | Promise<void>) {
        await transform({
          get: id => skills.get(id),
          add: skill => { skills.set(skill.id, skill); },
        });
      },
    },
    agent: {
      async transform(transform: (editor: { get(id: string): AgentFixture | undefined; update(id: string, update: (draft: AgentFixture) => void): void }) => void | Promise<void>) {
        await transform({
          get: id => agents.get(id),
          update(id, update) {
            const draft = agents.get(id) ?? { permissions: [] };
            update(draft);
            agents.set(id, draft);
          },
        });
      },
    },
    session: {
      async hook(name: string, handler: (event: ContextFixture) => void | Promise<void>) {
        hooks.set(name, handler);
      },
    },
  };
  await superpowers.setup(context as unknown as Plugin.Context);
  return { skills, agents, hooks, existingSkill, existingAgent };
}

test('OpenCode v2 registers bundled skills and agents while preserving existing definitions', async () => {
  assert.equal(superpowers.id, 'jj-superpowers');
  const { skills, agents, existingSkill, existingAgent } = await setupOpenCode();
  assert.equal(skills.get('brainstorming'), existingSkill);
  assert.equal(agents.get('sdd-implementer'), existingAgent);
  assert.equal(skills.get('brainstorming').content, 'Keep this skill');
  assert.equal(agents.get('sdd-implementer').system, 'Keep this agent');
  assert.match(skills.get('using-superpowers').content, /Instruction priority/);
  assert.match(skills.get('session-performance').description, /recorded agent session/);
  assert.match(skills.get('session-performance').path, /session-performance\/SKILL\.md$/);
  assert.equal(agents.get('sdd-verifier').mode, 'subagent');
  assert.match(agents.get('sdd-verifier').system, /verification file/);
  const reviewer = agents.get('code-reviewer');
  assert.match(reviewer.description, /^Use this agent when a major project step/);
  assert.match(reviewer.description, /Examples: <example>/);
  assert.doesNotMatch(reviewer.description, /description: \||model: inherit/);
  assert.match(reviewer.system, /You are a senior code reviewer/);
});

test('OpenCode v2 context hook injects compact system instructions without changing messages', async () => {
  const { hooks } = await setupOpenCode();
  assert.deepEqual([...hooks.keys()], ['context']);
  const hook = hooks.get('context');
  const messages = [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }];
  const originalMessages = structuredClone(messages);
  const event: ContextFixture = { system: [{ type: 'text', text: 'Existing instructions' }], messages };
  await hook(event);
  assert.equal(event.messages, messages);
  assert.deepEqual(messages, originalMessages);
  assert.equal(event.system[0].text, 'Existing instructions');
  assert.equal(event.system.length, 2);
  const context = event.system[1].text;

  assert.match(context, /You have jj-superpowers/);
  assert.match(context, new RegExp(ORCHESTRATOR_MARKER));
  assert.match(context, new RegExp(SUBAGENT_MARKER));
  assert.match(context, new RegExp(MAINTAINER_MARKER));
  assert.match(context, new RegExp(PROVIDER_GUIDANCE_MARKER));
  assert.match(context, new RegExp(NO_ATTRIBUTION_MARKER));
  assert.match(context, new RegExp(CONVENTIONS_PRECEDENCE_MARKER));
  assert.match(context, /native `subagent` tool/);
  assert.doesNotMatch(context, /ALREADY LOADED/);
  assert.doesNotMatch(context, new RegExp(FULL_SKILL_MARKER));
  assert.doesNotMatch(context, new RegExp(FLOWCHART_MARKER));
  assert.ok(context.length < MAX_OPENCODE_BOOTSTRAP_CHARS, `bootstrap was ${context.length} characters`);

  await hook(event);
  assert.equal(event.system.length, 2);
  assert.deepEqual(messages, originalMessages);
  const nextRequest: ContextFixture = { system: [], messages };
  await hook(nextRequest);
  assert.equal(nextRequest.system.length, 1);
  assert.equal(nextRequest.system[0].text, context);
  assert.equal(nextRequest.messages, messages);
});
