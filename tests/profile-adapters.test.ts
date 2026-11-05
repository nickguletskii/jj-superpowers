import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runHook } from '../hooks/profile/hook.ts';
import { normalizeHook, profileConfig } from '../scripts/profile-adapters.ts';
import profile from '../hooks/profile/oh-my-pi.ts';

const tool = { session_id: 's', agent_id: 'child', tool_use_id: 'call', tool_name: 'Bash',
  tool_input: { command: 'cargo test', cwd: '/workspace' } };

test('Codex command completion keeps exit status, output, and agent identity', () => {
  const [start] = normalizeHook('codex', 'PreToolUse', tool, 10);
  const [end] = normalizeHook('codex', 'PostToolUse', { ...tool, tool_response: { exit_code: 7, output: 'failure' } }, 25);
  assert.equal(start.id, end.id);
  assert.equal(end.agent, 'child');
  assert.equal(end.exitCode, 7);
  assert.equal(end.output, 'failure');
  assert.equal(end.phase, 'end');
  assert.equal(end.timestamp, 25);
});

test('non-build results do not retain tool output', () => {
  const [end] = normalizeHook('claude-code', 'PostToolUse', {
    ...tool, tool_input: { command: 'cat secrets' }, tool_response: { stdout: 'private' },
  });
  assert.equal(end.output, undefined);
});

test('background process return is not recorded as command completion', () => {
  const [result] = normalizeHook('codex', 'PostToolUse', {
    ...tool, tool_response: { session_id: 42, output: 'started' },
  });
  assert.equal(result.phase, 'instant');
  assert.equal(result.status, 'background-started');
});

test('missing call identity cannot accidentally pair concurrent commands', () => {
  assert.deepEqual(normalizeHook('codex', 'PreToolUse', { ...tool, tool_use_id: undefined }), []);
});

test('model hooks preserve retry pairing and child identity without prompt text', () => {
  const data = { session_id: 's', turn_id: 't', agent_id: 'child', model: 'model', prompt: 'private' };
  const [start] = normalizeHook('codex', 'PreModelRequest', data, 100);
  const [end] = normalizeHook('codex', 'PostModelRequest', { ...data, status: 'failed' }, 200);
  assert.equal(start.id, end.id);
  assert.equal(end.agent, 'child');
  assert.equal(end.status, 'failed');
  assert.ok(!JSON.stringify(end).includes('private'));
});

test('Antigravity records only evidence its published payload exposes', () => {
  const [result] = normalizeHook('antigravity', 'PostToolUse', {
    conversationId: 'c', stepIdx: 3, toolCall: { name: 'run_command', args: { CommandLine: 'bazel test //...', Cwd: '/w' } }, error: '',
  });
  assert.equal(result.id, 'step:3');
  assert.equal(result.exitCode, undefined);
  assert.equal(result.output, undefined);
  assert.equal(result.metadata.resultAvailable, false);
  assert.equal(result.metadata.boundary, 'tool-call-only');
});

test('subagent lifecycle is kept on a distinct lane', () => {
  const [result] = normalizeHook('claude-code', 'SubagentStart', { session_id: 'parent', agent_id: 'child', agent_type: 'worker' });
  assert.equal(result.agent, 'child');
  assert.equal(result.metadata.parentSession, 'parent');
});

test('config is opt-in, uses neutral commands, and quotes repository paths', () => {
  for (const harness of ['codex', 'claude-code']) {
    const config = profileConfig(harness, "/tmp/a' b");
    assert.ok(config.hooks.SubagentStart);
    assert.match(config.hooks.PreToolUse[0].hooks[0].command, /'\\''/);
    const hook = config.hooks.PreToolUse[0].hooks[0];
    assert.ok(!('async' in hook) || !hook.async);
  }
  assert.ok(profileConfig('antigravity')['jj-superpowers-profile'].PreInvocation);
  assert.ok(profileConfig('codex').hooks.PreModelRequest);
});

test('hook runner fails open silently for malformed input and recorder failure', async () => {
  assert.equal(await runHook('codex', 'PreToolUse', 'invalid json'), '');
  assert.equal(await runHook('codex', 'PreToolUse', JSON.stringify(tool), () => { throw new Error('disk full'); }), '');
  assert.deepEqual(JSON.parse(await runHook('antigravity', 'PreToolUse', '{}')), { decision: 'allow' });
});

test('OMP callbacks remain passive and distinguish headers from message completion', () => {
  const handlers = new Map();
  const records: Array<Record<string, any>> = [];
  profile({ on: (name, handler) => handlers.set(name, handler) }, event => records.push(event));
  const ctx = { cwd: '/w', model: { id: 'm' }, sessionManager: { getSessionId: () => 'child', getHeader: () => ({ parentSession: '/parent.jsonl' }) } };
  assert.equal(handlers.get('before_provider_request')({ payload: { secret: true } }, ctx), undefined);
  handlers.get('after_provider_response')({ status: 200 }, ctx);
  handlers.get('message_start')({ message: { role: 'assistant', content: 'private' } }, ctx);
  handlers.get('message_end')({ message: { role: 'assistant' } }, ctx);
  assert.equal(records[0].metadata.boundary, 'request-to-headers');
  assert.equal(records[1].phase, 'end');
  assert.equal(records[2].metadata.boundary, 'assistant-message-lifecycle');
  assert.equal(records[3].phase, 'end');
  assert.equal(records[0].metadata.parentSession, '/parent.jsonl');
  assert.ok(!JSON.stringify(records).includes('private'));
  assert.equal(handlers.get('tool_call')({ toolCallId: 'b', toolName: 'bash', input: { command: 'cargo test' } }, ctx), undefined);
  handlers.get('tool_result')({ toolCallId: 'b', toolName: 'bash', input: { command: 'cargo test' }, details: { async: { state: 'running', jobId: 'j' } }, content: [] }, ctx);
  assert.equal(records.at(-1).phase, 'instant');
});

test('Claude stderr-only build diagnostics are preserved', () => {
  const [event] = normalizeHook('claude-code', 'PostToolUse', { ...tool,
    tool_response: { stdout: '', stderr: 'compiler error', exitCode: 1 } });
  assert.equal(event.output, 'compiler error');
  assert.equal(event.exitCode, 1);
});

test('OMP advisor and main requests are paired separately within one session', () => {
  const handlers = new Map();
  const records: Array<Record<string, any>> = [];
  profile({ on: (name, handler) => handlers.set(name, handler) }, event => records.push(event));
  const ctx = id => ({ cwd: '/w', agent: { id, parentId: id === 'advisor' ? 'main' : undefined },
    sessionManager: { getSessionId: () => 'shared' } });
  handlers.get('before_provider_request')({}, ctx('main'));
  handlers.get('before_provider_request')({}, ctx('advisor'));
  handlers.get('after_provider_response')({}, ctx('main'));
  handlers.get('after_provider_response')({}, ctx('advisor'));
  assert.equal(records[0].id, records[2].id);
  assert.equal(records[1].id, records[3].id);
  assert.equal(records[1].agent, 'advisor');
  assert.equal(records[1].parentAgent, 'main');
  records.length = 0;
  handlers.get('before_provider_request')({}, ctx('main'));
  handlers.get('before_provider_request')({}, ctx('main'));
  handlers.get('after_provider_response')({}, ctx('main'));
  assert.equal(records.length, 2);
  assert.ok(records.every(record => record.phase === 'start'));
});

test('OMP recovers measurement after ambiguous same-agent activity drains', () => {
  const handlers = new Map(), records: Array<Record<string, any>> = [];
  profile({on:(name,handler)=>handlers.set(name,handler)}, event=>records.push(event));
  const ctx={agent:{id:'a'},sessionManager:{getSessionId:()=> 's'}};
  const start=()=>handlers.get('before_provider_request')({},ctx);
  const end=()=>handlers.get('after_provider_response')({status:200},ctx);
  start(); start(); end(); end();
  assert.equal(records.filter(e=>e.phase==='end').length,0);
  start(); end();
  assert.equal(records.filter(e=>e.phase==='end').length,1);
  assert.equal(records.at(-1).id,records.at(-2).id);
});
