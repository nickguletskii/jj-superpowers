import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const guard = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../skills/jujutsu/scripts/jj-guard.ts",
);
const hasJj = spawnSync("jj", ["--version"]).status === 0;

function freshRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jj-guard-"));
  spawnSync("jj", ["git", "init", "."], { cwd: dir });
  return dir;
}

function guardAsync(cwd, args) {
  return new Promise<{ status: number | null; stdout: string }>((resolve) => {
    const child = spawn("node", [guard, ...args], { cwd });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.on("close", (status) => resolve({ status, stdout }));
  });
}

function jjOut(cwd, args) {
  return spawnSync("jj", ["--no-pager", "--ignore-working-copy", ...args], { cwd, encoding: "utf8" }).stdout;
}

test("commit refuses to run without explicit paths", { skip: !hasJj }, () => {
  const dir = freshRepo();
  fs.writeFileSync(path.join(dir, "a"), "a\n");
  const res = spawnSync("node", [guard, "commit", "-m", "wip(r/t1): a"], { cwd: dir, encoding: "utf8" });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /explicit paths/);
});

test("concurrent guarded commits never diverge", { skip: !hasJj }, async () => {
  const dir = freshRepo();
  const n = 6;
  const results = await Promise.all(
    Array.from({ length: n }, (_, i) => {
      fs.writeFileSync(path.join(dir, `f${i}`), `${i}\n`);
      return guardAsync(dir, ["commit", "-m", `wip(r/t${i}): f${i}`, `f${i}`]);
    }),
  );
  for (const r of results) assert.equal(r.status, 0);
  const ids = new Set(results.map((r) => r.stdout.trim()));
  assert.equal(ids.size, n);
  assert.equal(jjOut(dir, ["log", "--no-graph", "-r", "divergent()", "-T", "change_id"]), "");
});

test("check reports leftover scaffolds for the given run only", { skip: !hasJj }, () => {
  const dir = freshRepo();
  fs.writeFileSync(path.join(dir, "a"), "a\n");
  spawnSync("node", [guard, "commit", "-m", "wip(run-a/t1): a", "a"], { cwd: dir });
  assert.equal(spawnSync("node", [guard, "check", "--prefix", "wip(run-a/"], { cwd: dir }).status, 4);
  assert.equal(spawnSync("node", [guard, "check", "--prefix", "wip(run-b/"], { cwd: dir }).status, 0);
});

test("pre-existing conflicts do not block; introduced ones fail", { skip: !hasJj }, () => {
  const dir = freshRepo();
  const run = (...args) => spawnSync("jj", ["--no-pager", ...args], { cwd: dir, encoding: "utf8" });
  fs.writeFileSync(path.join(dir, "x"), "base\n");
  run("commit", "-m", "base", "x");
  const base = jjOut(dir, ["log", "--no-graph", "-r", "@-", "-T", "change_id"]);
  for (const side of ["one", "two"]) {
    run("new", "--no-edit", "-r", base, "-m", side);
  }
  const [one, two] = ["one", "two"].map((d) =>
    jjOut(dir, ["log", "--no-graph", "-r", `description(exact:"${d}\n")`, "-T", "change_id"]),
  );
  // Give both siblings conflicting edits to x, then stack them: an unrelated conflict.
  for (const [id, text] of [[one, "one\n"], [two, "two\n"]]) {
    fs.writeFileSync(path.join(dir, "x"), text);
    run("squash", "--from", "@", "--into", id, "x");
  }
  run("rebase", "-r", two, "-o", one);
  assert.notEqual(jjOut(dir, ["log", "--no-graph", "-r", "conflicts()", "-T", "change_id"]), "");

  fs.writeFileSync(path.join(dir, "y"), "y\n");
  const ok = spawnSync("node", [guard, "commit", "-m", "wip(r/t1): y", "y"], { cwd: dir, encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);

  const bad = spawnSync("node", [guard, "run", "rebase", "-r", one, "-o", two], { cwd: dir, encoding: "utf8" });
  assert.equal(bad.status, 4, bad.stderr);
});

test("a lock abandoned by a dead holder is broken once its heartbeat stops", { skip: !hasJj }, () => {
  const dir = freshRepo();
  const lock = path.join(dir, ".jj", "repo", "jj-guard.lock");
  fs.mkdirSync(lock);
  fs.writeFileSync(path.join(lock, "owner"), "7\n");
  const old = new Date(Date.now() - 60_000);
  fs.utimesSync(path.join(lock, "owner"), old, old);
  fs.writeFileSync(path.join(dir, "a"), "a\n");
  const res = spawnSync("node", [guard, "commit", "-m", "wip(r/t1): a", "a"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, JJ_GUARD_TIMEOUT_MS: "5000" },
  });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.existsSync(lock), false);
});

test("a failed mutation still releases the lock", { skip: !hasJj }, () => {
  const dir = freshRepo();
  const bad = spawnSync("node", [guard, "run", "describe", "-r", "nonexistent", "-m", "x"], { cwd: dir });
  assert.notEqual(bad.status, 0);
  assert.equal(fs.existsSync(path.join(dir, ".jj", "repo", "jj-guard.lock")), false);
});
