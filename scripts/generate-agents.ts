import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Preamble = { core: string; editing: string };
type Frontmatter = {
  [key: string]: string | boolean;
  name?: string;
  description?: string;
  model?: string;
  codex_sandbox_mode?: string;
  opencode_tools_write?: boolean;
  opencode_tools_edit?: boolean;
};
type Agent = { frontmatter: Frontmatter; body: string };

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceDir = path.join(repoRoot, "agents");
const codexDir = path.join(repoRoot, ".codex", "agents");
const opencodeDir = path.join(repoRoot, ".opencode", "agents");
const preamblePath = path.join(sourceDir, "_preamble.md");

const PREAMBLE_START = "<!-- BEGIN SHARED PREAMBLE - generated, do not edit -->";
const PREAMBLE_END = "<!-- END SHARED PREAMBLE -->";
const EDITING_MARKER = "<!-- EDITING AGENTS ONLY -->";

// Agents that never edit shared files or write change descriptions. They get only the
// preamble core; every other agent (including new ones) also gets the editing section.
export const READ_ONLY_AGENTS = new Set([
  "code-reviewer",
  "codebase-cleanup-analysis-reviewer",
  "codebase-cleanup-deletion-reviewer",
  "codebase-cleanup-directory-mapper",
  "codebase-cleanup-map-consolidator",
  "codebase-cleanup-map-reviewer",
  "codebase-cleanup-refactoring-request",
  "sdd-design-reviewer",
  "sdd-quality-reviewer",
  "sdd-simplifier",
  "sdd-spec-reviewer",
  "sdd-verifier",
]);

// Returns { core, editing }. The core is prepended to every agent body: byte-identical
// and first-in-prompt across all agents, so it forms a shared prefix that providers can
// serve from cache. The editing section follows it only for editing agents.
export function loadPreamble(text = fs.readFileSync(preamblePath, "utf8")): Preamble {
  const stripped = text.replace(/^<!--[\s\S]*?-->\n*/, "");
  const parts = stripped.split(EDITING_MARKER);
  if (parts.length !== 2) {
    throw new Error(`${preamblePath} must contain exactly one ${EDITING_MARKER}`);
  }
  return { core: parts[0].trim(), editing: parts[1].trim() };
}

export function preambleFor(name: string, { core, editing }: Preamble): string {
  return READ_ONLY_AGENTS.has(name) ? core : `${core}\n\n${editing}`;
}

// Claude Code consumes agents/*.md directly, while .codex/.opencode are generated from
// them. So the preamble is SYNCED into the source bodies (between markers) rather than
// only injected downstream — otherwise Claude would be the one platform missing it.
// Idempotent: re-running replaces the marked block instead of stacking copies.
function withPreamble(body: string, preamble: string): string {
  const block = `${PREAMBLE_START}\n\n${preamble}\n\n${PREAMBLE_END}`;
  const existing = new RegExp(
    `${escapeRegExp(PREAMBLE_START)}[\\s\\S]*?${escapeRegExp(PREAMBLE_END)}`,
  );
  if (existing.test(body)) {
    return body.replace(existing, block);
  }
  return `${block}\n\n${body}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseAgentFile(filePath: string): Agent {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath} is missing YAML frontmatter`);
  }

  return {
    frontmatter: parseFrontmatter(match[1], filePath),
    body: match[2].trim(),
  };
}

function parseFrontmatter(frontmatter: string, filePath: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = frontmatter.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!scalar) {
      throw new Error(`${filePath}: unsupported frontmatter line: ${line}`);
    }

    const [, key, rawValue] = scalar;
    if (rawValue === "|" || rawValue === ">") {
      const block = [];
      i += 1;
      while (i < lines.length && /^(\s+|$)/.test(lines[i])) {
        block.push(lines[i].replace(/^ {2}/, ""));
        i += 1;
      }
      i -= 1;
      result[key] = block.join("\n").trimEnd();
    } else {
      result[key] = parseScalar(rawValue);
    }
  }

  return result;
}

function parseScalar(value: string): string | boolean {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed.replace(/^["']|["']$/g, "");
}

function tomlString(value: unknown): string {
  return JSON.stringify(String(value));
}

function tomlMultiline(value: unknown): string {
  const escaped = String(value).replace(/"""/g, '\\"\\"\\"');
  return `"""${escaped}\n"""`;
}

function renderCodexAgent(agent: Agent): string {
  const { frontmatter, body } = agent;
  const lines = [
    `name = ${tomlString(frontmatter.name)}`,
    `description = ${tomlString(frontmatter.description)}`,
  ];

  if (frontmatter.codex_sandbox_mode) {
    lines.push(`sandbox_mode = ${tomlString(frontmatter.codex_sandbox_mode)}`);
  }

  lines.push(`developer_instructions = ${tomlMultiline(body)}`);
  return `${lines.join("\n")}\n`;
}

function renderOpenCodeAgent(agent: Agent): string {
  const { frontmatter, body } = agent;
  const lines = [
    "---",
    `description: ${frontmatter.description}`,
    "mode: subagent",
  ];

  if (frontmatter.model && frontmatter.model !== "inherit") {
    lines.push(`model: ${frontmatter.model}`);
  }

  const hasToolConfig =
    frontmatter.opencode_tools_write !== undefined ||
    frontmatter.opencode_tools_edit !== undefined;
  if (hasToolConfig) {
    lines.push("tools:");
    if (frontmatter.opencode_tools_write !== undefined) {
      lines.push(`  write: ${frontmatter.opencode_tools_write}`);
    }
    if (frontmatter.opencode_tools_edit !== undefined) {
      lines.push(`  edit: ${frontmatter.opencode_tools_edit}`);
    }
  }

  lines.push("---", "", body);
  return `${lines.join("\n")}\n`;
}

function main() {
  fs.mkdirSync(codexDir, { recursive: true });
  fs.mkdirSync(opencodeDir, { recursive: true });

  const preamble = loadPreamble();

  // `_preamble.md` is excluded by this pattern — it is shared text, not an agent.
  const sourceFiles = fs
    .readdirSync(sourceDir)
    .filter((file) => /^[a-z0-9-]+\.md$/.test(file))
    .sort();

  // A stale entry would silently hand a renamed agent the wrong preamble.
  const names = new Set(sourceFiles.map((file) => file.replace(/\.md$/, "")));
  for (const name of READ_ONLY_AGENTS) {
    if (!names.has(name)) {
      throw new Error(`READ_ONLY_AGENTS lists unknown agent: ${name}`);
    }
  }

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const raw = fs.readFileSync(sourcePath, "utf8");
    const agent = parseAgentFile(sourcePath);
    const name = agent.frontmatter.name;

    if (!name) {
      throw new Error(`${sourcePath} is missing frontmatter name`);
    }
    if (!agent.frontmatter.description) {
      throw new Error(`${sourcePath} is missing frontmatter description`);
    }

    agent.body = withPreamble(agent.body, preambleFor(name, preamble));

    // Sync the source file itself — Claude Code reads these directly.
    const frontmatterBlock = raw.match(/^---\n[\s\S]*?\n---\n/)[0];
    const synced = `${frontmatterBlock}\n${agent.body}\n`;
    if (synced !== raw) {
      fs.writeFileSync(sourcePath, synced);
    }

    fs.writeFileSync(
      path.join(codexDir, `${name}.toml`),
      renderCodexAgent(agent),
    );
    fs.writeFileSync(
      path.join(opencodeDir, `${name}.md`),
      renderOpenCodeAgent(agent),
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
