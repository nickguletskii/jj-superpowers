import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const skillsRoot = path.join(repoRoot, "skills");

function activeSkillDirs() {
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(skillsRoot, name, "SKILL.md")))
    .sort();
}

test("skill consolidation leaves only intended entry points discoverable", () => {
  const skills = activeSkillDirs();

  for (const name of [
    "jj-organizing-history",
    "requesting-code-review",
    "receiving-code-review",
    "deslopify",
    "codebase-cleanup",
    "documentation",
  ]) {
    assert.ok(skills.includes(name), `${name} should be discoverable`);
  }

  for (const name of [
    "doc-wishlist",
    "wish-i-had",
    "wish-i-knew",
    "using-jj-worksets",
    "jj-reorg-changes",
    "jj-clean-history",
    "jj-split-parallel",
    "dot-to-jj-dag",
    "jj-agent-config",
  ]) {
    assert.ok(!skills.includes(name), `${name} should not be discoverable`);
    assert.ok(
      !fs.existsSync(path.join(skillsRoot, name, "SKILL.md")),
      `${name}/SKILL.md exists`,
    );
  }

  assert.ok(
    fs.existsSync(
      path.join(
        skillsRoot,
        "jj-organizing-history",
        "resources",
        "dot-to-jj-dag",
        "dot-to-jj-dag.py",
      ),
    ),
  );
  assert.ok(!fs.existsSync(path.join(skillsRoot, "dot-to-jj-dag")));
});
