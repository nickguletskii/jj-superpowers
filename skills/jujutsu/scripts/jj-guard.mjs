#!/usr/bin/env node
// Serializes mutating jj commands across every agent and workspace sharing one repo,
// and fails loudly when a mutation introduces divergent or conflicted changes.
//
// jj is lock-free by design: concurrent operations are merged, and two operations that
// rewrite the same commit (e.g. two snapshots of a shared `@`) leave it divergent.
// Agents therefore funnel every mutation through this script, and run every read with
// `--ignore-working-copy` so reads never snapshot.
//
// Usage:
//   jj-guard.mjs commit -m <message> <path>...   commit exactly these paths; prints the new change id
//   jj-guard.mjs run <jj args>...                run any other mutating jj command under the lock
//   jj-guard.mjs check [--prefix <scaffold>] [--all]
//                                                report divergent/conflicted changes (and scaffolds) in
//                                                the work under any workspace, or all mutable changes

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LOCK_TIMEOUT_MS = Number(process.env.JJ_GUARD_TIMEOUT_MS ?? 120_000);
// The holder refreshes its timestamp while it runs. PIDs cannot prove liveness: sandboxes
// and containers give each process its own PID namespace, so a dead holder's PID is
// routinely "alive" again.
const HEARTBEAT_MS = 2_000;
const STALE_MS = 15_000;

class GuardError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

function jj(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("jj", ["--no-pager", ...args]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => reject(new GuardError(`cannot run jj: ${e.message}`, 2)));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

async function jjOk(args) {
  const res = await jj(args);
  if (res.status !== 0) throw new GuardError(res.stderr.trimEnd(), res.status ?? 1);
  return res;
}

// The repo store is shared by all workspaces; secondary workspaces hold a `.jj/repo`
// file pointing at it, so the lock lives there to cover every workspace at once.
async function repoStore() {
  const root = (await jjOk(["root", "--ignore-working-copy"])).stdout.trim();
  const repo = path.join(root, ".jj", "repo");
  if (fs.statSync(repo).isDirectory()) return repo;
  return path.resolve(path.dirname(repo), fs.readFileSync(repo, "utf8").trim());
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function lockAge(owner) {
  try {
    return Date.now() - fs.statSync(owner).mtimeMs;
  } catch {
    // Holder has created the directory but not yet written its owner file.
    return 0;
  }
}

// mkdir is atomic on every platform we target, unlike flock(1), which macOS lacks.
async function withLock(fn) {
  const lock = path.join(await repoStore(), "jj-guard.lock");
  const owner = path.join(lock, "owner");
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (let delay = 50; ; delay = Math.min(delay * 2, 1000)) {
    try {
      fs.mkdirSync(lock);
      fs.writeFileSync(owner, `${process.pid}\n`);
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (lockAge(owner) > STALE_MS) {
        fs.rmSync(lock, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) throw new GuardError(`timed out waiting for ${lock}`, 3);
      await sleep(delay);
    }
  }
  const heartbeat = setInterval(() => {
    const now = new Date();
    try {
      fs.utimesSync(owner, now, now);
    } catch {
      // Lock was broken as stale; the post-check will still report any damage.
    }
  }, HEARTBEAT_MS);
  try {
    return await fn();
  } finally {
    clearInterval(heartbeat);
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

// Another workspace rewriting our `@`'s ancestors makes this workspace stale; that is
// expected in per-implementer-workspace mode and safe to repair before mutating.
async function updateStaleIfNeeded() {
  const res = await jj(["status"]);
  if (res.status !== 0 && /stale/i.test(res.stderr)) await jjOk(["workspace", "update-stale"]);
}

// Unrelated branches may already hold conflicted changes, so a mutation fails only on
// problems it introduced; `check` covers the work in progress in every workspace.
async function problems({ prefix, scope = "mutable()" } = {}) {
  const parts = ["divergent()", "conflicts()"];
  if (prefix) parts.push(`description(substring:${JSON.stringify(prefix)})`);
  const revset = `(${scope}) & (${parts.join(" | ")})`;
  const tmpl =
    'change_id.short(12) ++ " " ++ if(divergent, "divergent ", "") ++ if(conflict, "conflict", "") ++ "\\t" ++ description.first_line() ++ "\\n"';
  const out = (await jjOk(["log", "--ignore-working-copy", "--no-graph", "-r", revset, "-T", tmpl])).stdout;
  return out.split("\n").filter(Boolean);
}

async function guarded(context, mutate) {
  const key = (line) => line.split("\t")[0];
  const before = new Set((await problems()).map(key));
  await updateStaleIfNeeded();
  await mutate();
  const introduced = (await problems()).filter((line) => !before.has(key(line)));
  if (introduced.length > 0) {
    throw new GuardError(
      `${context} introduced divergent or conflicted changes:\n${introduced.join("\n")}\n` +
        "Stop and report to the orchestrator; recovery: jj-superpowers:jujutsu, safety rule 7.",
      4,
    );
  }
}

async function main([cmd, ...rest]) {
  if (cmd === "commit") {
    const mIdx = rest.indexOf("-m");
    if (mIdx < 0 || !rest[mIdx + 1]) throw new GuardError("commit needs -m <message>", 2);
    const message = rest[mIdx + 1];
    const paths = rest.filter((_, i) => i !== mIdx && i !== mIdx + 1);
    if (paths.length === 0) {
      throw new GuardError("commit needs explicit paths; a bare `jj commit` takes every agent's edits", 2);
    }
    await withLock(() =>
      guarded("commit", async () => {
        await jjOk(["commit", "-m", message, "--", ...paths]);
        const id = await jjOk(["log", "--ignore-working-copy", "--no-graph", "-r", "@-", "-T", "change_id.short(12)"]);
        // Report the id even if the post-check fails: the caller needs it to recover.
        process.stdout.write(id.stdout.trim() + "\n");
      }),
    );
  } else if (cmd === "run") {
    if (rest.length === 0) throw new GuardError("run needs jj arguments", 2);
    await withLock(() =>
      guarded(rest[0], async () => {
        const res = await jjOk(rest);
        process.stdout.write(res.stdout);
        process.stderr.write(res.stderr);
      }),
    );
  } else if (cmd === "check") {
    const pIdx = rest.indexOf("--prefix");
    const found = await problems({
      prefix: pIdx >= 0 ? rest[pIdx + 1] : undefined,
      scope: rest.includes("--all") ? "mutable()" : "mutable() & ::working_copies()",
    });
    if (found.length > 0) {
      process.stdout.write(found.join("\n") + "\n");
      process.exitCode = 4;
    }
  } else {
    throw new GuardError("usage: jj-guard.mjs commit -m <msg> <path>... | run <jj args>... | check [--prefix <p>] [--all]", 2);
  }
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write(`jj-guard: ${e.message}\n`);
  process.exitCode = e instanceof GuardError ? e.code : 1;
});
