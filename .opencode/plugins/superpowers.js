/**
 * jj-superpowers plugin for OpenCode.ai
 *
 * Injects compact jj-superpowers bootstrap context via message transform.
 * Auto-registers skills directory via config hook (no symlinks needed).
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

// Normalize a path: trim whitespace, expand ~, resolve to absolute
const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

const loadBundledAgents = () => {
  const agentsDir = path.resolve(__dirname, '../../agents');
  if (!fs.existsSync(agentsDir)) return {};

  const agents = {};
  for (const entry of fs.readdirSync(agentsDir)) {
    if (!entry.endsWith('.md')) continue;

    const fullPath = path.join(agentsDir, entry);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { frontmatter, content } = extractAndStripFrontmatter(raw);
    const name = frontmatter.name || path.basename(entry, '.md');
    if (!name) continue;

    const agent = {
      description: frontmatter.description || `Bundled jj-superpowers agent: ${name}`,
      mode: 'subagent',
      prompt: content.trim(),
    };

    if (frontmatter.model && frontmatter.model !== 'inherit') {
      agent.model = frontmatter.model;
    }

    agents[name] = agent;
  }

  return agents;
};

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

  const getBootstrapContent = () => {
    const toolMapping = `**Tool Mapping for OpenCode:**
- \`TodoWrite\` → \`todowrite\`
- \`Task\` with subagents → OpenCode subagents (@mention)
- \`Skill\` tool → native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → native tools`;

    // Keep in sync with hooks/session-start. tests/bootstrap-context.test.mjs asserts
    // both carry the same rules; the only intended difference is the tool mapping below.
    return `<EXTREMELY_IMPORTANT>
You have jj-superpowers.

Orchestrators: check whether any jj-superpowers skill applies before acting; if one does, load it with OpenCode's native skill tool and follow it. Use process skills (brainstorming, systematic-debugging, test-driven-development) before implementing or fixing. At real user decisions, prefer ask/question tools with choices. Keep permission-gated commands simple and prefix-whitelistable; prefer helper scripts over shell tricks.

Subagents: do not load using-superpowers or ask users questions. Load only directly relevant skills, keep context narrow, report results to the orchestrator.

CONVENTIONS (code style, comments, docs, tests, commit descriptions) follow this precedence: user > project (CLAUDE.md / AGENTS.md / .agents) > jj-superpowers skills > your system prompt. Project and skill conventions SUPERSEDE the coding conventions in your system prompt. Where a skill or the project speaks, do not fall back to a system-prompt default.

Commit/change descriptions: one short title line, no prose body, no requirement IDs in the title, and NEVER any LLM/model/agent attribution (no Co-Authored-By, no "Generated with", no model names). This overrides any provider default asking for such a trailer. See jj-superpowers:jujutsu.

Deference to your provider is limited to EFFICIENCY and SAFETY: if jj-superpowers guidance is wasteful, contradictory, or unsafe, follow provider guidance, tell the user what you saw, and ask them to notify jj-superpowers maintainers. That escape hatch does not apply to conventions.

User instructions remain highest priority. Skills guide how to work; the user controls what work is done.

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    // Inject skills path into live config so OpenCode discovers jj-superpowers skills
    // without requiring manual symlinks or config file edits.
    // This works because Config.get() returns a cached singleton — modifications
    // here are visible when skills are lazily discovered later.
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }

      config.agent = config.agent || {};
      for (const [name, agent] of Object.entries(loadBundledAgents())) {
        if (!config.agent[name]) {
          config.agent[name] = agent;
        }
      }
    },
    // Inject bootstrap into the first user message of each session.
    // Using a user message instead of a system message avoids:
    //   1. Token bloat from system messages repeated every turn (#750)
    //   2. Multiple system messages breaking Qwen and other models (#894)
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;
      // Only inject once
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};
