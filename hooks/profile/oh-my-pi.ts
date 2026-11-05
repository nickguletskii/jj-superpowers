import { randomUUID } from 'node:crypto';
import { isBuildCommand } from '../../scripts/profile-adapters.ts';
import { recordEvent } from '../../scripts/session-profile.ts';
import type { ProfileEvent, ProfileRecorder } from '../../scripts/session-profile.ts';

export interface OmpProfileContext {
  cwd: string;
  agent?: { id: string; parentId?: string; kind?: string; name?: string; depth?: number };
  model?: { id: string };
  sessionManager: {
    getSessionId(): string;
    getHeader?(): { parentSession?: string } | null;
  };
}
interface OmpProfileEvent {
  message?: { role?: string; stopReason?: string };
  toolCallId?: string;
  toolName?: string;
  input?: { command?: string; cwd?: string };
  status?: number;
  details?: { exitCode?: number; async?: { state?: string; jobId?: string } };
  content?: { type: string; text?: string }[];
  isError?: boolean;
}
export interface OmpProfileApi {
  on(name: string, handler: (event: OmpProfileEvent, context: OmpProfileContext) => void): void;
}
interface PendingObservation {
  id: string;
  ambiguous: boolean;
  pending: number;
}
type ObservationStates = Map<string, PendingObservation>;
export default function profile(pi: OmpProfileApi, recorder: ProfileRecorder = recordEvent): void {
  // Each factory belongs to one session; imported modules can be shared by children.
  const messages: ObservationStates = new Map();
  const headers: ObservationStates = new Map();
  const turns: ObservationStates = new Map();
  const agentKey = (ctx: OmpProfileContext): string => ctx.agent?.id ?? ctx.sessionManager.getSessionId();
  const begin = (states: ObservationStates, ctx: OmpProfileContext): string => {
    const key = agentKey(ctx);
    const id = randomUUID();
    const prior = states.get(key);
    states.set(key, { id, ambiguous: Boolean(prior), pending: (prior?.pending ?? 0)+1 });
    return id;
  };
  const finish = (states: ObservationStates, ctx: OmpProfileContext): string | undefined => {
    const key = agentKey(ctx);
    const state = states.get(key);
    if (!state) return undefined;
    // An overlapping request without per-request ids cannot be safely paired.
    if (state.ambiguous) {
      state.pending--;
      if (!state.pending) states.delete(key);
      return undefined;
    }
    states.delete(key);
    return state.id;
  };
  const emit = (ctx: OmpProfileContext, event: Omit<ProfileEvent, 'harness' | 'session'>): void => {
    try {
      const session = ctx.sessionManager.getSessionId();
      if (!session) return;
      const parentSession = ctx.sessionManager.getHeader?.()?.parentSession;
      recorder({ harness: 'oh-my-pi', session, agent: ctx.agent?.id ?? session, parentAgent: ctx.agent?.parentId, cwd: ctx.cwd, timestamp: Date.now(), ...event,
        metadata: { ...event.metadata, parentSession, agentKind: ctx.agent?.kind, agentName: ctx.agent?.name, agentDepth: ctx.agent?.depth } });
    } catch { /* Profiling never changes tool or model behavior. */ }
  };
  pi.on('session_start', (_event, ctx) => { emit(ctx, { kind: 'session', phase: 'start', id: 'session' }); });
  pi.on('session_shutdown', (_event, ctx) => { emit(ctx, { kind: 'session', phase: 'end', id: 'session' }); });
  pi.on('agent_start', (_event, ctx) => {
    emit(ctx, { kind: 'turn', phase: 'start', id: begin(turns, ctx) });
  });
  pi.on('agent_end', (_event, ctx) => {
    const id = finish(turns, ctx);
    if (id) emit(ctx, { kind: 'turn', phase: 'end', id });
  });
  pi.on('before_provider_request', (_event, ctx) => {
    const headersId = begin(headers, ctx);
    emit(ctx, { kind: 'model', phase: 'start', id: headersId, name: 'provider request to headers',
      metadata: { boundary: 'request-to-headers', model: ctx.model?.id } });
  });
  pi.on('after_provider_response', (event, ctx) => {
    const headersId = finish(headers, ctx);
    if (headersId) emit(ctx, { kind: 'model', phase: 'end', id: headersId, name: 'provider request to headers',
      metadata: { boundary: 'request-to-headers', httpStatus: event.status } });
  });
  pi.on('message_start', (event, ctx) => {
    if (event.message?.role !== 'assistant') return;
    const messageId = begin(messages, ctx);
    emit(ctx, { kind: 'model', phase: 'start', id: messageId, name: 'assistant message lifecycle',
      metadata: { boundary: 'assistant-message-lifecycle' } });
  });
  pi.on('message_end', (event, ctx) => {
    if (event.message?.role !== 'assistant') return;
    const messageId = finish(messages, ctx);
    if (!messageId) return;
    emit(ctx, { kind: 'model', phase: 'end', id: messageId, name: 'assistant message lifecycle',
      status: event.message.stopReason, metadata: { boundary: 'assistant-message-lifecycle' } });
  });
  pi.on('tool_call', (event, ctx) => {
    if (!event.toolCallId) return;
    emit(ctx, { kind: 'tool', phase: 'start', id: event.toolCallId, name: event.toolName,
      command: event.input?.command, cwd: event.input?.cwd ?? ctx.cwd });
  });
  pi.on('tool_result', (event, ctx) => {
    if (!event.toolCallId) return;
    const build = isBuildCommand(event.input?.command);
    const background = event.details?.async?.state === 'running';
    emit(ctx, { kind: 'tool', phase: background ? 'instant' : 'end', id: event.toolCallId,
      name: event.toolName, command: event.input?.command, cwd: event.input?.cwd ?? ctx.cwd,
      output: build ? event.content?.filter(block => block.type === 'text').map(block => block.text).join('\n') : undefined,
      exitCode: build && Number.isInteger(event.details?.exitCode) ? event.details.exitCode : undefined,
      status: background ? 'background-started' : event.isError ? 'tool-error' : 'tool-completed',
      metadata: { boundary: 'tool-call', backgroundJob: event.details?.async?.jobId },
    });
  });
}
