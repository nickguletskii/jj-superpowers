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
    '{"name":"jj-superpowers","main":".opencode/plugins/superpowers/index.ts"}\n',
  );
  return root;
}

function runInstaller(home, args, options: { path?: string } = {}) {
  return spawnSync(
    process.execPath,
    [
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
  assert.deepEqual(installed.plugins, [source]);

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
  assert.deepEqual(uninstalled.plugins, []);
});

test("oh-my-pi invokes the plugin command and surfaces failures", () => {
  const home = tempDir();
  const source = makeSourceRepo();
  const bin = tempDir();
  const omp = path.join(bin, "omp");
  fs.writeFileSync(omp, '#!/bin/sh\nprintf "%s\\n" "$@" > "$HOME/omp-args"\n', { mode: 0o755 });
  const args = ["install", "--harness", "oh-my-pi", "--repo", source];
  const installed = runInstaller(home, args, { path: bin });
  assert.equal(installed.status, 0, installed.stderr || installed.error?.message);
  assert.match(installed.stdout, /oh-my-pi installed/);
  assert.equal(fs.readFileSync(path.join(home, "omp-args"), "utf8"), `plugin\nlink\n${source}\n`);
  fs.writeFileSync(omp, '#!/bin/sh\necho "plugin link failed" >&2\nexit 7\n');
  const failed = runInstaller(home, args, { path: bin });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /plugin link failed/);
});

test("OpenCode v2 migrates managed legacy entry and preserves unrelated plugin options", () => {
  const home=tempDir(), source=makeSourceRepo();
  const configPath=path.join(home,'.config','opencode','opencode.json');
  fs.mkdirSync(path.dirname(configPath),{recursive:true});
  fs.writeFileSync(configPath,JSON.stringify({plugin:[`jj-superpowers@file:${source}`,'legacy-other',['legacy-options',{enabled:false}]],plugins:[{package:'native-other',options:{mode:'review'}}],model:'keep/model'}));
  const result=runInstaller(home,['install','--harness','opencode','--repo',source]);
  assert.equal(result.status,0,result.stderr || result.error?.message);
  const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
  assert.equal(config.model,'keep/model');
  assert.equal(config.plugin,undefined);
  assert.deepEqual(config.plugins,[{package:'native-other',options:{mode:'review'}},source,'legacy-other',{package:'legacy-options',options:{enabled:false}}]);
  const again=runInstaller(home,['install','--harness','opencode','--repo',source]);
  assert.equal(again.status,0,again.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath,'utf8')),config);
  const removed=runInstaller(home,['uninstall','--harness','opencode','--repo',source]);
  assert.equal(removed.status,0,removed.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath,'utf8')).plugins,config.plugins.filter(entry => entry !== source));
});

test("OpenCode v2 retains managed plugin options in legacy tuples and native objects", () => {
  for (const native of [false,true]) {
    const home=tempDir(), source=makeSourceRepo();
    const configPath=path.join(home,'.config','opencode','opencode.json');
    fs.mkdirSync(path.dirname(configPath),{recursive:true});
    const options={enabled:false,label:'keep'};
    fs.writeFileSync(configPath,JSON.stringify(native
      ? {plugins:[{package:source,options}]}
      : {plugin:[[ `jj-superpowers@file:${source}`,options]]}));
    const result=runInstaller(home,['install','--harness','opencode','--repo',source]);
    assert.equal(result.status,0,result.stderr || result.error?.message);
    assert.deepEqual(JSON.parse(fs.readFileSync(configPath,'utf8')).plugins,[{package:source,options}]);
    const status=runInstaller(home,['status','--harness','opencode','--repo',source]);
    assert.equal(status.status,0,status.stderr);
    assert.match(status.stdout,/opencode installed/);
  }
});
