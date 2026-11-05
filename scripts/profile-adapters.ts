#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProfileEvent, ProfileKind, ProfilePhase } from './session-profile.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

export function isBuildCommand(command: unknown): command is string {
  return typeof command === 'string' && /(?:^|[\s;&|()])(?:[^\s;&|()]*\/)?(?:cargo|bazel|bazelisk)(?=\s|$)/.test(command);
}

interface ToolResponseFields {
  output?: unknown;
  exitCode?: number;
  background?: boolean;
}
interface ToolInput {
  command?: string;
  cmd?: string;
  CommandLine?: string;
  cwd?: string;
  workdir?: string;
  Cwd?: string;
}
export interface HookPayload {
  conversationId?: string;
  session_id?: string;
  agent_id?: string;
  agent_type?: string;
  parent_session_id?: string;
  cwd?: string;
  workspacePaths?: string[];
  turn_id?: string;
  model?: string;
  modelName?: string;
  status?: string;
  token_usage?: unknown;
  invocationNum?: number;
  stepIdx?: number;
  toolCall?: { name?: string; args?: ToolInput };
  tool_input?: ToolInput;
  tool_name?: string;
  tool_use_id?: string;
  tool_response?: unknown;
  error?: string;
}
function responseFields(response: unknown): ToolResponseFields {
  if (typeof response === 'string') {
    const code = response.match(/(?:Process exited with code|Exit code:)\s*(-?\d+)/i);
    return { output: response, exitCode: code ? Number(code[1]) : undefined,
      background: /(?:Process running with session ID|Script running with cell ID)/.test(response) };
  }
  if (!response || typeof response !== 'object') return {};
  const result = response as Record<string, unknown>;
  return {
    output: result.output ?? (typeof result.stdout === 'string' || typeof result.stderr === 'string'
      ? [result.stdout, result.stderr].filter(value => typeof value === 'string' && value.length).join('\n')
      : result.content),
    exitCode: typeof (result.exit_code ?? result.exitCode) === 'number' ? (result.exit_code ?? result.exitCode) as number : undefined,
    background: result.background === true || result.async === true || result.status === 'running'
      || (result.session_id != null && result.exit_code == null && result.exitCode == null),
  };
}

// Normalize only published hook fields. Missing identities stay missing rather than
// correlating unrelated parallel calls by their command text.
export function normalizeHook(harness: string, eventName: string, payload: HookPayload, timestamp = Date.now()): ProfileEvent[] {
  if (!payload || typeof payload !== 'object') return [];
  const agy = harness === 'antigravity';
  const session = agy ? payload.conversationId : payload.session_id;
  if (typeof session !== 'string' || !session) return [];
  const base = { session, harness, agent: payload.agent_id ?? 'main', timestamp,
    cwd: payload.cwd ?? payload.workspacePaths?.[0] };
  const metadata = { boundary: 'harness-hook', agentType: payload.agent_type, parentSession: payload.parent_session_id };
  if (harness === 'codex' && !payload.agent_id && ['PreToolUse', 'PostToolUse'].includes(eventName)) base.agent = 'unattributed';
  const event = (kind: ProfileKind, phase: ProfilePhase, id: string, extra: Partial<ProfileEvent> = {}): ProfileEvent[] => [{ ...base, kind, phase, id, metadata, ...extra }];
  if (['SubagentStart', 'SubagentStop'].includes(eventName)) {
    if (!payload.agent_id) return [];
    return event('session', eventName === 'SubagentStart' ? 'start' : 'end', `agent:${payload.agent_id}`, { name: payload.agent_type ?? 'subagent', metadata: { ...metadata, parentSession: session } });
  }
  if (eventName === 'SessionStart') return event('session', 'start', 'session');
  if (eventName === 'SessionEnd') return event('session', 'end', 'session');
  if (eventName === 'UserPromptSubmit') return event('turn', 'start', payload.turn_id ?? 'turn');
  if (['Stop', 'Interrupt'].includes(eventName)) return event('turn', 'end', payload.turn_id ?? 'turn', { status: eventName.toLowerCase() });
  if (['PreModelRequest', 'PostModelRequest'].includes(eventName) && harness === 'codex') {
    if (!payload.turn_id) return [];
    return event('model', eventName === 'PreModelRequest' ? 'start' : 'end', `model:${payload.turn_id}:${base.agent}`, {
      name: payload.model ?? 'model request', status: payload.status,
      metadata: { ...metadata, boundary: 'model-request-attempt', tokenUsage: payload.token_usage },
    });
  }
  if (['PreInvocation', 'PostInvocation'].includes(eventName) && agy) {
    if (!Number.isInteger(payload.invocationNum)) return [];
    return event('model', eventName === 'PreInvocation' ? 'start' : 'end', `model:${payload.invocationNum}`, { name: payload.modelName ?? 'model invocation' });
  }
  if (!['PreToolUse', 'PostToolUse', 'PostToolUseFailure'].includes(eventName)) return [];
  const input = agy ? payload.toolCall?.args : payload.tool_input;
  const name = agy ? payload.toolCall?.name : payload.tool_name;
  const id = agy ? (Number.isInteger(payload.stepIdx) ? `step:${payload.stepIdx}` : undefined) : payload.tool_use_id;
  if (!id || typeof name !== 'string') return [];
  const command = input?.command ?? input?.cmd ?? input?.CommandLine;
  const build = isBuildCommand(command);
  const result: ToolResponseFields = agy ? {} : responseFields(payload.tool_response);
  const phase = eventName === 'PreToolUse' ? 'start' : result.background ? 'instant' : 'end';
  return event('tool', phase, id, { name, command: typeof command === 'string' ? command : undefined,
    cwd: input?.cwd ?? input?.workdir ?? input?.Cwd ?? base.cwd,
    exitCode: build && Number.isInteger(result.exitCode) ? result.exitCode : undefined,
    output: build ? result.output : undefined,
    status: result.background ? 'background-started' : payload.error ? 'tool-error' : undefined,
    metadata: { ...metadata, resultAvailable: !agy,
      ...(agy ? { boundary: 'tool-call-only', error: build ? payload.error : undefined } : {}) },
  });
}

export interface ProfileHookDefinition {
  type?: 'command';
  command?: string;
  timeout?: number;
  matcher?: string;
  async?: boolean;
  hooks?: ProfileHookDefinition[];
}
export interface ProfileHarnessConfig {
  extension?: string;
  hooks?: Record<string, ProfileHookDefinition[]>;
  'jj-superpowers-profile'?: Record<string, ProfileHookDefinition[]>;
}
export function profileConfig(harness: string, root = repoRoot): ProfileHarnessConfig {
  const script = path.join(root, 'hooks', 'profile', 'hook.ts');
  const command = (event: string): string => `node ${shellQuote(script)} ${shellQuote(harness)} ${shellQuote(event)}`;
  if (harness === 'oh-my-pi') return { extension: path.join(root, 'hooks', 'profile', 'oh-my-pi.ts') };
  if (harness === 'antigravity') {
    const hooks: Record<string, ProfileHookDefinition[]> = {};
    for (const event of ['SessionStart', 'PreInvocation', 'PostInvocation', 'Stop']) hooks[event] = [{ type: 'command', command: command(event), timeout: 3 }];
    for (const event of ['PreToolUse', 'PostToolUse']) hooks[event] = [{ matcher: '.*', hooks: [{ type: 'command', command: command(event), timeout: 3 }] }];
    return { "jj-superpowers-profile": hooks };
  }
  if (!['claude-code', 'codex'].includes(harness)) throw new Error(`Unknown harness: ${harness}`);
  const events = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop', 'SessionEnd', 'SubagentStart', 'SubagentStop'];
  if (harness === 'claude-code') events.push('PostToolUseFailure');
  if (harness === 'codex') events.push('PreModelRequest', 'PostModelRequest', 'Interrupt');
  return { hooks: Object.fromEntries(events.map(event => [event, [{
    ...(['PreToolUse', 'PostToolUse', 'PostToolUseFailure'].includes(event) ? { matcher: '.*' } : {}),
    hooks: [{ type: 'command', command: command(event), timeout: 3 }],
  }]])) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] !== 'config' || !process.argv[3]) throw new Error('Usage: node scripts/profile-adapters.ts config <claude-code|codex|antigravity|oh-my-pi>');
    console.log(JSON.stringify(profileConfig(process.argv[3]), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
