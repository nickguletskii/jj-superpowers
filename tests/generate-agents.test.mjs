import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);

const expectedAgents = [
  "codebase-cleanup-directory-mapper",
  "codebase-cleanup-map-consolidator",
  "codebase-cleanup-map-reviewer",
  "codebase-cleanup-analysis",
  "codebase-cleanup-analysis-reviewer",
  "codebase-cleanup-deletion",
  "codebase-cleanup-deletion-reviewer",
  "codebase-cleanup-refactoring-request",
];

test("codebase-cleanup native agents are generated for Codex and OpenCode", () => {
  for (const name of expectedAgents) {
    const source = path.join(repoRoot, "agents", `${name}.md`);
    const codex = path.join(repoRoot, ".codex", "agents", `${name}.toml`);
    const opencode = path.join(repoRoot, ".opencode", "agents", `${name}.md`);

    assert.equal(fs.existsSync(source), true, `${source} should exist`);
    assert.equal(fs.existsSync(codex), true, `${codex} should exist`);
    assert.equal(fs.existsSync(opencode), true, `${opencode} should exist`);

    assert.match(fs.readFileSync(codex, "utf8"), new RegExp(`name = "${name}"`));
    assert.match(fs.readFileSync(opencode, "utf8"), /mode: subagent/);
  }
});

const START = "<!-- BEGIN SHARED PREAMBLE - generated, do not edit -->";
const END = "<!-- END SHARED PREAMBLE -->";

function preambleBlock(name) {
  const text = fs.readFileSync(path.join(repoRoot, "agents", `${name}.md`), "utf8");
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  assert.ok(start !== -1 && end > start, `${name} should carry the shared preamble`);
  return text.slice(start + START.length, end).trim();
}

test("preamble core is a byte-identical prefix; editing section only for editing agents", async () => {
  const { loadPreamble, READ_ONLY_AGENTS } = await import("../scripts/generate-agents.mjs");
  const { core, editing } = loadPreamble();

  assert.match(core, /--ignore-working-copy/, "jj rule belongs in the core");
  assert.doesNotMatch(core, /commit or change description/);
  assert.match(editing, /commit or change description/);

  const agents = fs
    .readdirSync(path.join(repoRoot, "agents"))
    .filter((file) => /^[a-z0-9-]+\.md$/.test(file))
    .map((file) => file.replace(/\.md$/, ""));

  for (const name of agents) {
    const block = preambleBlock(name);
    assert.ok(block.startsWith(core), `${name} preamble should start with the core`);
    if (READ_ONLY_AGENTS.has(name)) {
      assert.equal(block, core, `${name} is read-only and should get only the core`);
    } else {
      assert.equal(block, `${core}\n\n${editing}`, `${name} should get core + editing`);
    }
  }

  for (const name of ["sdd-implementer", "codebase-cleanup-deletion"]) {
    assert.equal(READ_ONLY_AGENTS.has(name), false, `${name} edits files`);
  }
  for (const name of ["sdd-verifier", "code-reviewer", "codebase-cleanup-map-reviewer"]) {
    assert.equal(READ_ONLY_AGENTS.has(name), true, `${name} is read-only`);
  }
});
