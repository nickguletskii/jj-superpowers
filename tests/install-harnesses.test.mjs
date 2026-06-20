import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const script = path.join(repoRoot, "scripts", "install-harnesses.ts");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "jj-superpowers-install-"));
}

function makeSourceRepo() {
  const root = tempDir();
  fs.mkdirSync(path.join(root, "skills", "using-superpowers"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, "skills", "using-superpowers", "SKILL.md"),
    "---\nname: using-superpowers\ndescription: test\n---\n",
  );
  fs.mkdirSync(path.join(root, ".codex", "agents"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".codex", "agents", "sdd-implementer.toml"),
    'name = "sdd-implementer"\n',
  );
  fs.writeFileSync(
    path.join(root, ".codex", "agents", "codebase-cleanup-analysis.toml"),
    'name = "codebase-cleanup-analysis"\n',
  );
  fs.mkdirSync(path.join(root, "tools"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "tools", "scip-query"),
    "#!/usr/bin/env python3\n",
  );
  fs.mkdirSync(
    path.join(root, "skills", "jj-organizing-history", "resources", "dot-to-jj-dag"),
    { recursive: true },
  );
  fs.writeFileSync(
    path.join(
      root,
      "skills",
      "jj-organizing-history",
      "resources",
      "dot-to-jj-dag",
      "dot-to-jj-dag.py",
    ),
    "#!/usr/bin/env python3\n",
  );
  fs.mkdirSync(path.join(root, "agents"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "agents", "sdd-implementer.md"),
    "---\nname: sdd-implementer\ndescription: test\n---\n",
  );
  fs.writeFileSync(
    path.join(root, "agents", "codebase-cleanup-analysis.md"),
    "---\nname: codebase-cleanup-analysis\ndescription: test\n---\n",
  );
  fs.mkdirSync(path.join(root, ".claude-plugin"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".claude-plugin", "plugin.json"),
    '{"name":"jj-superpowers"}\n',
  );
  fs.writeFileSync(
    path.join(root, "package.json"),
    '{"name":"jj-superpowers","main":".opencode/plugins/superpowers.js"}\n',
  );
  return root;
}

function runInstaller(home, args, options = {}) {
  return spawnSync(
    "deno",
    [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-run",
      script,
      ...args,
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: home,
        PATH: options.path ?? process.env.PATH,
      },
      encoding: "utf8",
    },
  );
}

function assertSymlink(target, source) {
  const stat = fs.lstatSync(target);
  assert.equal(stat.isSymbolicLink(), true, `${target} should be a symlink`);
  assert.equal(fs.realpathSync(target), fs.realpathSync(source));
}

test("install requires explicit harness selection", () => {
  const home = tempDir();
  const source = makeSourceRepo();

  const result = runInstaller(home, ["install", "--repo", source]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /--all|--harness/);
  assert.equal(
    fs.existsSync(path.join(home, ".agents", "skills", "jj-superpowers")),
    false,
  );
});

test("codex install status and uninstall manage only repo links", () => {
  const home = tempDir();
  const source = makeSourceRepo();

  const install = runInstaller(home, [
    "install",
    "--harness",
    "codex",
    "--repo",
    source,
  ]);
  assert.equal(install.status, 0, install.stderr || install.stdout);
  assertSymlink(
    path.join(home, ".agents", "skills", "using-superpowers"),
    path.join(source, "skills", "using-superpowers"),
  );
  assertSymlink(
    path.join(home, ".codex", "agents", "sdd-implementer.toml"),
    path.join(source, ".codex", "agents", "sdd-implementer.toml"),
  );
  assertSymlink(
    path.join(home, ".codex", "agents", "codebase-cleanup-analysis.toml"),
    path.join(source, ".codex", "agents", "codebase-cleanup-analysis.toml"),
  );
  assertSymlink(
    path.join(home, ".jj-superpowers", "tools", "scip-query"),
    path.join(source, "tools", "scip-query"),
  );
  assertSymlink(
    path.join(home, ".jj-superpowers", "tools", "dot-to-jj-dag.py"),
    path.join(
      source,
      "skills",
      "jj-organizing-history",
      "resources",
      "dot-to-jj-dag",
      "dot-to-jj-dag.py",
    ),
  );

  const status = runInstaller(home, [
    "status",
    "--harness",
    "codex",
    "--repo",
    source,
  ]);
  assert.equal(status.status, 0, status.stderr || status.stdout);
  assert.match(status.stdout, /codex\s+installed/);

  const uninstall = runInstaller(home, [
    "uninstall",
    "--harness",
    "codex",
    "--repo",
    source,
  ]);
  assert.equal(uninstall.status, 0, uninstall.stderr || uninstall.stdout);
  assert.equal(
    fs.existsSync(path.join(home, ".agents", "skills", "using-superpowers")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(home, ".codex", "agents", "sdd-implementer.toml")),
    false,
  );
  assert.equal(
    fs.existsSync(
      path.join(home, ".codex", "agents", "codebase-cleanup-analysis.toml"),
    ),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(home, ".jj-superpowers", "tools", "scip-query")),
    false,
  );
  assert.equal(
    fs.existsSync(
      path.join(home, ".jj-superpowers", "tools", "dot-to-jj-dag.py"),
    ),
    false,
  );
});

test("install reports conflicts without force", () => {
  const home = tempDir();
  const source = makeSourceRepo();
  const conflict = path.join(home, ".agents", "skills", "using-superpowers");
  fs.mkdirSync(conflict, { recursive: true });

  const result = runInstaller(home, [
    "install",
    "--harness",
    "codex",
    "--repo",
    source,
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /conflict/i);
  assert.equal(fs.lstatSync(conflict).isDirectory(), true);
});

test("dry-run reports conflicts without failing or mutating", () => {
  const home = tempDir();
  const source = makeSourceRepo();
  const conflict = path.join(home, ".agents", "skills", "using-superpowers");
  fs.mkdirSync(conflict, { recursive: true });

  const result = runInstaller(home, [
    "install",
    "--harness",
    "codex",
    "--dry-run",
    "--repo",
    source,
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /conflict/i);
  assert.equal(fs.lstatSync(conflict).isDirectory(), true);
});

test("opencode install and uninstall patch plugin config", () => {
  const home = tempDir();
  const source = makeSourceRepo();
  const configPath = path.join(home, ".config", "opencode", "opencode.json");

  const install = runInstaller(home, [
    "install",
    "--harness",
    "opencode",
    "--repo",
    source,
  ]);
  assert.equal(install.status, 0, install.stderr || install.stdout);
  assertSymlink(
    path.join(home, ".jj-superpowers", "tools", "scip-query"),
    path.join(source, "tools", "scip-query"),
  );
  const installed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.deepEqual(installed.plugin, [`jj-superpowers@file:${source}`]);

  const uninstall = runInstaller(home, [
    "uninstall",
    "--harness",
    "opencode",
    "--repo",
    source,
  ]);
  assert.equal(uninstall.status, 0, uninstall.stderr || uninstall.stdout);
  assert.equal(
    fs.existsSync(path.join(home, ".jj-superpowers", "tools", "scip-query")),
    false,
  );
  const uninstalled = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.deepEqual(uninstalled.plugin, []);
});
