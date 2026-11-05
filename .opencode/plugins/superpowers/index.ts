import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Plugin, Skill } from '@opencode/plugin';
import { parseAgentFile } from '../../../scripts/generate-agents.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const bootstrap = fs.readFileSync(path.join(repoRoot, 'hooks/bootstrap.md'), 'utf8').trimEnd()
  + '\n\n**Tool Mapping for OpenCode v2:**\n'
  + '- Agent delegation → native `subagent` tool\n'
  + '- Skills → native `skill` tool\n'
  + '- Commands → native `shell` tool\n'
  + '- Track work in the plan artifacts; todos are optional in v2.';

export default Plugin.define({
  id: 'jj-superpowers',
  async setup(ctx) {
    const skills = fs.readdirSync(path.join(repoRoot, 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
      .map(entry => path.join(repoRoot, 'skills', entry.name, 'SKILL.md'))
      .filter(file => fs.existsSync(file))
      .map(file => ({ file, ...parseAgentFile(file) }));
    const agents = fs.readdirSync(path.join(repoRoot, 'agents'))
      .filter(file => /^[a-z0-9-]+\.md$/.test(file))
      .map(file => ({ id: path.basename(file, '.md'), ...parseAgentFile(path.join(repoRoot, 'agents', file)) }));

    await ctx.skill.transform(editor => {
      for (const skill of skills) {
        const id = String(skill.frontmatter.name ?? path.basename(path.dirname(skill.file)));
        if (editor.get(id)) continue;
        editor.add({
          id: Skill.ID.make(id), name: Skill.Name.make(id),
          path: Skill.Info.fields.path.make(skill.file),
          description: String(skill.frontmatter.description ?? ''), content: skill.body,
        });
      }
    });
    await ctx.agent.transform(editor => {
      for (const agent of agents) {
        if (editor.get(agent.id)) continue;
        editor.update(agent.id, draft => {
          draft.mode = 'subagent';
          draft.system = agent.body;
          draft.description = String(agent.frontmatter.description ?? agent.id);
          if (agent.frontmatter.opencode_tools_write === false || agent.frontmatter.opencode_tools_edit === false) {
            draft.permissions.push({ action: 'edit', resource: '*', effect: 'deny' });
          }
          const model = agent.frontmatter.model;
          if (typeof model === 'string' && model !== 'inherit') {
            const slash = model.indexOf('/');
            if (slash <= 0) throw new Error(`Agent ${agent.id} needs a provider/model reference`);
            const [id, variant] = model.slice(slash+1).split('#');
            draft.model = { providerID: model.slice(0,slash), id, ...(variant ? {variant} : {}) } as typeof draft.model;
          }
        });
      }
    });
    await ctx.session.hook('context', event => {
      if (!event.system.some(part => part.type === 'text' && part.text.includes('You have jj-superpowers'))) {
        event.system.push({ type: 'text', text: bootstrap });
      }
    });
  },
});
