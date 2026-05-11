import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'agents');
const codexDir = path.join(repoRoot, '.codex', 'agents');
const opencodeDir = path.join(repoRoot, '.opencode', 'agents');

function parseAgentFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath} is missing YAML frontmatter`);
  }

  return {
    frontmatter: parseFrontmatter(match[1], filePath),
    body: match[2].trim(),
  };
}

function parseFrontmatter(frontmatter, filePath) {
  const result = {};
  const lines = frontmatter.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!scalar) {
      throw new Error(`${filePath}: unsupported frontmatter line: ${line}`);
    }

    const [, key, rawValue] = scalar;
    if (rawValue === '|' || rawValue === '>') {
      const block = [];
      i += 1;
      while (i < lines.length && /^(\s+|$)/.test(lines[i])) {
        block.push(lines[i].replace(/^ {2}/, ''));
        i += 1;
      }
      i -= 1;
      result[key] = block.join('\n').trimEnd();
    } else {
      result[key] = parseScalar(rawValue);
    }
  }

  return result;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed.replace(/^["']|["']$/g, '');
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function tomlMultiline(value) {
  const escaped = String(value).replace(/"""/g, '\\"\\"\\"');
  return `"""${escaped}\n"""`;
}

function renderCodexAgent(agent) {
  const { frontmatter, body } = agent;
  const lines = [
    `name = ${tomlString(frontmatter.name)}`,
    `description = ${tomlString(frontmatter.description)}`,
  ];

  if (frontmatter.codex_sandbox_mode) {
    lines.push(`sandbox_mode = ${tomlString(frontmatter.codex_sandbox_mode)}`);
  }

  lines.push(`developer_instructions = ${tomlMultiline(body)}`);
  return `${lines.join('\n')}\n`;
}

function renderOpenCodeAgent(agent) {
  const { frontmatter, body } = agent;
  const lines = [
    '---',
    `description: ${frontmatter.description}`,
    'mode: subagent',
  ];

  if (frontmatter.model && frontmatter.model !== 'inherit') {
    lines.push(`model: ${frontmatter.model}`);
  }

  const hasToolConfig =
    frontmatter.opencode_tools_write !== undefined ||
    frontmatter.opencode_tools_edit !== undefined;
  if (hasToolConfig) {
    lines.push('tools:');
    if (frontmatter.opencode_tools_write !== undefined) {
      lines.push(`  write: ${frontmatter.opencode_tools_write}`);
    }
    if (frontmatter.opencode_tools_edit !== undefined) {
      lines.push(`  edit: ${frontmatter.opencode_tools_edit}`);
    }
  }

  lines.push('---', '', body);
  return `${lines.join('\n')}\n`;
}

function main() {
  fs.mkdirSync(codexDir, { recursive: true });
  fs.mkdirSync(opencodeDir, { recursive: true });

  const sourceFiles = fs
    .readdirSync(sourceDir)
    .filter((file) => /^sdd-.*\.md$/.test(file))
    .sort();

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const agent = parseAgentFile(sourcePath);
    const name = agent.frontmatter.name;

    if (!name) {
      throw new Error(`${sourcePath} is missing frontmatter name`);
    }
    if (!agent.frontmatter.description) {
      throw new Error(`${sourcePath} is missing frontmatter description`);
    }

    fs.writeFileSync(path.join(codexDir, `${name}.toml`), renderCodexAgent(agent));
    fs.writeFileSync(path.join(opencodeDir, `${name}.md`), renderOpenCodeAgent(agent));
  }
}

main();
