#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import type { ProfileRecorder } from '../../scripts/session-profile.ts';

// Keep the runner injectable so failure handling can be tested without starting a host.
export async function runHook(harness: string, eventName: string | undefined, input: string, recorder?: ProfileRecorder): Promise<string> {
  try {
    const payload = JSON.parse(input);
    const { normalizeHook } = await import('../../scripts/profile-adapters.ts');
    const record = recorder ?? (await import('../../scripts/session-profile.ts')).recordEvent;
    for (const event of normalizeHook(harness, eventName ?? payload.hook_event_name, payload)) record(event);
  } catch {
    // The host operation remains unaffected if profiling is unavailable.
  }
  // Antigravity requires a neutral pre-tool decision; allow delegates to its policy.
  return harness === 'antigravity' && eventName === 'PreToolUse' ? JSON.stringify({ decision: 'allow' }) : '';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    process.stdout.write(await runHook(process.argv[2], process.argv[3], Buffer.concat(chunks).toString('utf8')));
  } catch { /* No profiling failure should fail the host tool. */ }
}
