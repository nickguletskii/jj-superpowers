#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export type ProfileKind = 'tool' | 'model' | 'turn' | 'session';
export type ProfilePhase = 'start' | 'end' | 'instant';
export interface ProfileEvent {
  session: string;
  harness: string;
  agent?: string;
  parentAgent?: string;
  parentSession?: string;
  kind: ProfileKind;
  phase: ProfilePhase;
  id: string;
  name?: string;
  command?: string;
  cwd?: string;
  timestamp?: number;
  exitCode?: number;
  output?: unknown;
  status?: string;
  metadata?: Record<string, unknown>;
}
export interface RecordedProfileEvent extends ProfileEvent {
  timestamp: number;
  version?: number;
  observedNs?: string;
  outputTruncated?: boolean;
}
export interface ProfileSpan extends RecordedProfileEvent {
  start: number;
  end: number;
  durationMs: number;
}
export interface IncompleteProfileEvent extends RecordedProfileEvent {
  reason: string;
}
export interface ProfileReadResult {
  events: RecordedProfileEvent[];
  warnings: string[];
}
export type ProfileRecorder = (event: ProfileEvent, options?: { root?: string }) => unknown;

export function profileRoot(): string {
  return process.env.JJ_SUPERPOWERS_PROFILE_DIR || path.join(os.homedir(), '.local/state/jj-superpowers/profiles');
}
const hash = (value: unknown): string => createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
export function recordEvent(event: ProfileEvent, { root = profileRoot() }: { root?: string } = {}): string {
  if (!event.session || !event.harness || !event.id || !['start', 'end', 'instant'].includes(event.phase) || !['tool', 'model', 'turn', 'session'].includes(event.kind)) throw new Error('Invalid profile event identity or lifecycle');
  const timestamp = event.timestamp ?? Date.now();
  if (!Number.isFinite(timestamp) || timestamp < 0) throw new Error('Invalid timestamp');
  const dir = path.join(root, hash(`${event.harness}:${event.session}`));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const record: RecordedProfileEvent = { version: 1, ...event, timestamp, observedNs: process.hrtime.bigint().toString() };
  // Bound captured output; the rest of the event deliberately excludes raw hook payloads.
  if (record.output !== undefined) {
    const output = typeof record.output === 'string' ? record.output : JSON.stringify(record.output);
    record.output = output.slice(0, 65536);
    record.outputTruncated = output.length > 65536;
  }
  const dest = path.join(dir, `${timestamp}-${randomUUID()}.json`);
  const temporary = `${dest}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(record), { mode: 0o600, flag: 'wx' });
  fs.renameSync(temporary, dest);
  return dest;
}
export function readEvents(dir: string): ProfileReadResult {
  const events: RecordedProfileEvent[] = [], warnings: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory())) {
    const child = readEvents(path.join(dir, entry.name));
    events.push(...child.events); warnings.push(...child.warnings);
  }
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.json')).sort()) {
    try {
      const event = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (event.version !== 1 || !Number.isFinite(event.timestamp)) throw new Error('invalid record');
      events.push(event);
    } catch { warnings.push(`Unreadable event: ${file}`); }
  }
  events.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp-b.timestamp;
    if (/^\d+$/.test(a.observedNs ?? '') && /^\d+$/.test(b.observedNs ?? '')) {
      const left = BigInt(a.observedNs), right = BigInt(b.observedNs);
      return left < right ? -1 : left > right ? 1 : 0;
    }
    return 0;
  });
  return { events, warnings };
}
const identity = (e: ProfileEvent): string => JSON.stringify([e.harness, e.session, e.agent ?? 'main', e.kind, e.id]);
export function spansFromEvents(events: RecordedProfileEvent[]): { spans: ProfileSpan[]; incomplete: IncompleteProfileEvent[] } {
  const pending = new Map<string, RecordedProfileEvent>(), spans: ProfileSpan[] = [], unmatched: IncompleteProfileEvent[] = [];
  for (const event of events) {
    const key = identity(event);
    if (event.phase === 'start') {
      if (pending.has(key)) unmatched.push({ ...pending.get(key), reason: 'duplicate start' });
      pending.set(key, event);
    } else if (event.phase === 'end') {
      const start = pending.get(key);
      if (start && event.timestamp >= start.timestamp) {
        spans.push({ ...start, ...event, start: start.timestamp, end: event.timestamp, durationMs: event.timestamp - start.timestamp, name: start.name ?? event.name, command: start.command ?? event.command, cwd: start.cwd ?? event.cwd });
        pending.delete(key);
      } else unmatched.push({ ...event, reason: 'missing start' });
    }
  }
  unmatched.push(...[...pending.values()].map(e => ({ ...e, reason: 'missing end' })));
  return { spans, incomplete: unmatched };
}
export function unionMs(intervals: number[][]): number {
  const sorted = intervals.map(([a,b]) => [a,b]).sort((a,b) => a[0]-b[0]);
  let end = -Infinity, total = 0;
  for (const [a,b] of sorted) { total += Math.max(0, b - Math.max(a,end)); end = Math.max(end,b); }
  return total;
}
const operationSummary = <T extends RecordedProfileEvent>({ output, ...event }: T): Omit<T, 'output'> => event;
export function summarize(events: RecordedProfileEvent[]) {
  const { spans, incomplete } = spansFromEvents(events);
  const first = events.length ? events.reduce((n,e) => Math.min(n,e.timestamp),Infinity) : 0;
  const last = events.length ? events.reduce((n,e) => Math.max(n,e.timestamp),-Infinity) : 0;
  const elapsedMs = last-first;
  const active = spans.filter(s => s.kind === 'tool' || s.kind === 'model');
  const categories = {} as Record<'tool' | 'model' | 'command' | 'otherTool', { count: number; summedMs: number; busyMs: number }>;
  for (const kind of ['tool','model','command','otherTool'] as const) {
    const matching = active.filter(s => kind === 'command' ? s.kind === 'tool' && s.command : kind === 'otherTool' ? s.kind === 'tool' && !s.command : s.kind === kind);
    categories[kind] = { count: matching.length, summedMs: matching.reduce((n,s) => n+s.durationMs,0), busyMs: unionMs(matching.map(s => [s.start,s.end])) };
  }
  const agentGroups = new Map();
  for (const s of active) {
    const key = JSON.stringify([s.harness,s.session,s.agent ?? 'main']);
    const entry = agentGroups.get(key) ?? { harness:s.harness, session:s.session, agent:s.agent ?? 'main', parentAgent:s.parentAgent, parentSession:s.parentSession ?? s.metadata?.parentSession, intervals:[], summedMs:0, operations:0 };
    entry.intervals.push([s.start,s.end]); entry.summedMs += s.durationMs; entry.operations++;
    agentGroups.set(key,entry);
  }
  const agents = [...agentGroups.values()].map(({intervals,...entry}) => ({...entry,busyMs:unionMs(intervals)}));
  const commands = new Map();
  for (const s of spans.filter(s => s.command)) {
    const key = JSON.stringify([s.cwd ?? '',s.command]);
    const entry = commands.get(key) ?? { command: s.command, cwd: s.cwd, count: 0, summedMs: 0 };
    entry.count++; entry.summedMs += s.durationMs; commands.set(key,entry);
  }
  const busyMs = unionMs(active.map(s => [s.start,s.end]));
  return { elapsedMs, busyMs, unattributedMs: Math.max(0,elapsedMs-busyMs), categories, agents, incomplete: incomplete.map(operationSummary), repeatedCommands: [...commands.values()].filter(e => e.count > 1).sort((a,b) => b.summedMs-a.summedMs), longestOperations: [...active].sort((a,b) => b.durationMs-a.durationMs).slice(0,20).map(operationSummary), note: 'Category busy times can overlap. Unattributed time is not measured model time. Repeated commands may be necessary after edits. Timings describe observed hook boundaries, not CPU time.' };
}
export function exportTrace(events: RecordedProfileEvent[]) {
  const { spans, incomplete } = spansFromEvents(events);
  const traceEvents = [], lanes = new Map(), occupied = new Map();
  const lane = (e: ProfileEvent, slot = 0): number => {
    const key = JSON.stringify([e.harness,e.session,e.agent ?? 'main',e.kind,slot]);
    if (!lanes.has(key)) {
      const tid = lanes.size+1; lanes.set(key,tid);
      traceEvents.push({ ph:'M', name:'thread_name', pid:1, tid, args:{name:`${e.harness}/${e.session}/${e.agent ?? 'main'}/${e.kind}${slot ? ` (${slot+1})` : ''}`} });
    }
    return lanes.get(key);
  };
  for (const s of [...spans].sort((a,b) => a.start-b.start)) {
    const group = JSON.stringify([s.harness,s.session,s.agent ?? 'main',s.kind]);
    const ends = occupied.get(group) ?? [];
    let slot = ends.findIndex(end => end <= s.start);
    if (slot < 0) slot = ends.length;
    ends[slot] = s.end; occupied.set(group,ends);
    traceEvents.push({ ph:'X', name:s.command ?? s.name ?? s.kind, cat:s.kind, ts:s.start*1000, dur:s.durationMs*1000, pid:1, tid:lane(s,slot), args:{ id:s.id, parentAgent:s.parentAgent, parentSession:s.parentSession, cwd:s.cwd, exitCode:s.exitCode, status:s.status, metadata:s.metadata, output:s.output, outputTruncated:s.outputTruncated } });
  }
  if (events.length) {
    let cursor = events.reduce((n,e) => Math.min(n,e.timestamp),Infinity);
    const last = events.reduce((n,e) => Math.max(n,e.timestamp),-Infinity);
    const gaps = [];
    for (const s of spans.filter(s => s.kind === 'tool' || s.kind === 'model').sort((a,b) => a.start-b.start)) {
      if (s.start > cursor) gaps.push([cursor,s.start]);
      cursor = Math.max(cursor,s.end);
    }
    if (cursor < last) gaps.push([cursor,last]);
    traceEvents.push({ph:'M',name:'thread_name',pid:1,tid:0,args:{name:'Unattributed wall time (not measured LLM time)'}});
    for (const [start,end] of gaps) traceEvents.push({ph:'X',name:'Unattributed',cat:'unattributed',ts:start*1000,dur:(end-start)*1000,pid:1,tid:0,args:{}});
  }
  for (const e of [...events.filter(e => e.phase === 'instant'),...incomplete]) traceEvents.push({ ph:'i', s:'t', name:'reason' in e && e.reason ? `Incomplete: ${e.name ?? e.kind} (${e.reason})` : e.name ?? e.kind, cat:e.kind, ts:e.timestamp*1000, pid:1, tid:lane(e), args:{id:e.id,status:e.status} });
  return { traceEvents, displayTimeUnit:'ms', metadata:{ format:'jj-superpowers-session-profile-v1', incompleteSpans:incomplete.length } };
}

function main(args: string[]) {
  const [command, dir, destination] = args;
  if (command === 'list') {
    const root = profileRoot();
    if (!fs.existsSync(root)) return console.log('[]');
    const sessions = fs.readdirSync(root,{withFileTypes:true}).filter(e => e.isDirectory()).map(entry => {
      const directory = path.join(root,entry.name);
      const {events,warnings} = readEvents(directory);
      return { directory, harness:events[0]?.harness, session:events[0]?.session, events:events.length, lastTimestamp:events.at(-1)?.timestamp, warnings };
    });
    console.log(JSON.stringify(sessions,null,2)); return;
  }
  if (!['summary','export'].includes(command) || !dir || (command === 'export' && !destination)) throw new Error('Usage: session-profile.ts list | summary <session-dir> | export <session-dir> <trace.json>');
  const {events,warnings} = readEvents(dir);
  if (command === 'summary') console.log(JSON.stringify({...summarize(events),warnings},null,2));
  else fs.writeFileSync(destination,JSON.stringify({...exportTrace(events),warnings}),{mode:0o600});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode=1; }
}
