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
