import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { recordEvent, readEvents, summarize, exportTrace, spansFromEvents } from '../scripts/session-profile.ts';
const event = (kind: 'tool' | 'model' | 'turn' | 'session',phase: 'start' | 'end' | 'instant',id: string,timestamp: number,extra: Record<string, unknown>={}) => ({session:'s',harness:'fixture',kind,phase,id,timestamp,...extra});

test('overlap is unioned; gaps never become model time; sequential reused ids pair', () => {
  const events = [event('turn','start','turn',0),event('tool','start','a',10,{command:'cargo test',cwd:'/repo'}),event('tool','start','b',20),event('tool','end','a',50,{exitCode:1}),event('tool','end','b',60),event('model','start','m',70),event('model','end','m',80),event('model','start','m',80),event('model','end','m',90),event('turn','end','turn',100)];
  const summary = summarize(events);
  assert.equal(summary.elapsedMs,100);
  assert.equal(summary.categories.tool.summedMs,80);
  assert.equal(summary.categories.tool.busyMs,50);
  assert.equal(summary.categories.model.busyMs,20);
  assert.equal(summary.unattributedMs,30);
  assert.equal(summary.incomplete.length,0);
  const trace = exportTrace(events);
  assert.equal(trace.traceEvents.filter(e=>e.ph==='X' && e.cat==='model').length,2);
  assert.equal(trace.traceEvents.find(e=>e.name==='cargo test').args.exitCode,1);
  assert.equal(trace.traceEvents.find(e=>e.name==='cargo test').dur,40000);
  assert.equal(new Set(trace.traceEvents.filter(e=>e.cat==='tool').map(e=>e.tid)).size,2);
  assert.equal(trace.traceEvents.filter(e=>e.cat==='unattributed').reduce((n,e)=>n+e.dur,0),30000);
});

test('missing completion is incomplete, never fabricated success or duration', () => {
  const events = [event('tool','start','bg',1),event('tool','end','orphan',3),event('turn','end','t',10)];
  const {spans,incomplete} = spansFromEvents(events);
  assert.equal(spans.length,0);
  assert.equal(incomplete.length,3);
  assert.equal(summarize(events).busyMs,0);
  assert.equal(exportTrace(events).traceEvents.filter(e=>e.ph==='X' && e.cat==='tool').length,0);
});

test('records are bounded, private, path safe and tolerant of damaged records', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'jj-profile-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const paths = await Promise.all(Array.from({length:30},(_,i)=>Promise.resolve().then(()=>recordEvent(event('tool','instant',String(i),i,{session:'../../escape',output:'x'.repeat(70000)}),{root}))));
  assert.equal(new Set(paths).size,30);
  assert.ok(paths.every(p=>p.startsWith(root+path.sep)));
  const dir = path.dirname(paths[0]);
  fs.writeFileSync(path.join(dir,'bad.json'),'{');
  fs.writeFileSync(path.join(dir,'partial.tmp'),'{');
  const {events,warnings} = readEvents(dir);
  assert.equal(events.length,30);
  assert.equal(warnings.length,1);
  assert.ok(typeof events[0].output === 'string');
  assert.equal(events[0].output.length,65536);
  assert.equal(events[0].outputTruncated,true);
  if (process.platform !== 'win32') assert.equal(fs.statSync(paths[0]).mode & 0o777,0o600);
  assert.throws(()=>recordEvent({...event('tool','start','x',0),timestamp:NaN},{root}));
});

test('repeat command evidence includes cwd and does not imply wasted work', () => {
  const events = [event('tool','start','a',0,{command:'bazel test //...',cwd:'/a'}),event('tool','end','a',5),event('tool','start','b',6,{command:'bazel test //...',cwd:'/a'}),event('tool','end','b',10),event('tool','start','c',11,{command:'bazel test //...',cwd:'/b'}),event('tool','end','c',12)];
  assert.equal(summarize(events).repeatedCommands[0].count,2);
  assert.equal(summarize(events).repeatedCommands[0].summedMs,9);
  assert.deepEqual(summarize([]).categories.model,{count:0,summedMs:0,busyMs:0});
});

test('persisted equal timestamp boundaries preserve sequential attempt order', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'jj-profile-order-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const events = [event('model','start','m',1),event('model','end','m',2),event('model','start','m',2),event('model','end','m',3)];
  let file;
  for (const e of events) file=recordEvent(e,{root});
  const loaded=readEvents(path.dirname(file));
  assert.equal(spansFromEvents(loaded.events).spans.length,2);
  assert.equal(spansFromEvents(loaded.events).incomplete.length,0);
});

test('parent and child sessions share a trace without overlapping identities', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'jj-profile-child-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for (const e of [event('tool','start','same',1,{agent:'parent'}),event('tool','start','same',2,{agent:'child',session:'child-session',parentSession:'s'}),event('tool','end','same',3,{agent:'parent'}),event('tool','end','same',4,{agent:'child',session:'child-session',parentSession:'s'})]) recordEvent(e,{root});
  const {events}=readEvents(root);
  const trace=exportTrace(events);
  assert.equal(trace.traceEvents.filter(e=>e.ph==='X').length,2);
  assert.equal(new Set(trace.traceEvents.filter(e=>e.ph==='X' && e.cat==='tool').map(e=>e.tid)).size,2);
  assert.equal(summarize(events).busyMs,3);
  assert.equal(summarize(events).categories.tool.summedMs,4);
});

test('summary keeps large command output in records rather than report text', () => {
  const events=[event('tool','start','a',1,{command:'cargo check'}),event('tool','end','a',2,{output:'diagnostics'.repeat(1000)})];
  assert.equal('output' in summarize(events).longestOperations[0],false);
  assert.equal(exportTrace(events).traceEvents.find(e=>e.cat==='tool').args.output.length,11000);
});
