#!/usr/bin/env node

import * as fs from "node:fs/promises";
import type { Stats } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const isNotFound = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

type CommandName = "list" | "status" | "install" | "uninstall";
type HarnessId =
  | "claude-code"
  | "codex"
  | "agy"
  | "pi"
  | "oh-my-pi"
  | "opencode";
type TargetKind = "file" | "dir";
type ArtifactStatus = "installed" | "missing" | "conflict";

type Context = {
  repoRoot: string;
  home: string;
  dryRun: boolean;
  force: boolean;
};

type SymlinkSpec = {
  source: string;
  target: string;
  targetKind: TargetKind;
};

type JsonArraySpec = {
  path: string;
  key: string;
  value: string;
};

type ArtifactCheck = {
  label: string;
  status: ArtifactStatus;
  target: string;
  expected?: string;
};

type Harness = {
  id: HarnessId;
  name: string;
  description: string;
  install(ctx: Context): Promise<void>;
  uninstall(ctx: Context): Promise<void>;
  status(ctx: Context): Promise<ArtifactCheck[]>;
};

type ParsedArgs = {
  command: CommandName;
  harnesses: HarnessId[];
  all: boolean;
  dryRun: boolean;
  force: boolean;
  repoRoot: string;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const HARNESS_IDS: HarnessId[] = [
  "claude-code",
  "codex",
  "agy",
  "pi",
  "oh-my-pi",
  "opencode",
];

function usage(): string {
  return `Usage: node scripts/install-harnesses.ts <list|status|install|uninstall> [options]\n\nOptions:\n  --harness <id>  Select a harness; repeat for multiple harnesses\n  --all           Select all harnesses\n  --dry-run       Print operations without writing files\n  --force         Replace conflicting install targets\n  --repo <path>   Repository root (defaults to this checkout)\n`;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [commandArg, ...rest] = argv;
  if (!commandArg || !isCommand(commandArg)) {
    throw new Error(`Unknown or missing command.\n${usage()}`);
  }

  const harnesses: HarnessId[] = [];
  let all = false;
  let dryRun = false;
  let force = false;
  let repoRoot = DEFAULT_REPO_ROOT;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--all") {
      all = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--harness") {
      const value = rest[++i];
      if (!value) throw new Error("--harness requires a value");
      if (!isHarnessId(value)) throw new Error(`Unknown harness: ${value}`);
      if (!harnesses.includes(value)) harnesses.push(value);
    } else if (arg === "--repo") {
      const value = rest[++i];
      if (!value) throw new Error("--repo requires a value");
      repoRoot = path.resolve(value);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (all && harnesses.length > 0) {
    throw new Error("Use either --all or --harness, not both");
  }

  if (commandArg !== "list" && !all && harnesses.length === 0) {
    throw new Error(`${commandArg} requires --all or at least one --harness`);
  }

  return { command: commandArg, harnesses, all, dryRun, force, repoRoot };
}

function isCommand(value: string): value is CommandName {
  return (
    value === "list" ||
    value === "status" ||
    value === "install" ||
    value === "uninstall"
  );
}

function isHarnessId(value: string): value is HarnessId {
  return (HARNESS_IDS as string[]).includes(value);
}

function context(args: ParsedArgs): Context {
  const home = process.env.HOME;
  if (!home) throw new Error("HOME is not set");
  return {
    repoRoot: args.repoRoot,
    home,
    dryRun: args.dryRun,
    force: args.force,
  };
}

function selectedHarnesses(args: ParsedArgs): Harness[] {
  if (args.command === "list") return HARNESSES;
  const ids = args.all ? HARNESS_IDS : args.harnesses;
  return ids.map((id) => harnessById(id));
}

function harnessById(id: HarnessId): Harness {
  const harness = HARNESSES.find((candidate) => candidate.id === id);
  if (!harness) throw new Error(`Unknown harness: ${id}`);
  return harness;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

async function ensureDir(dir: string, ctx: Context): Promise<void> {
  if (ctx.dryRun) {
    console.log(`ensure-dir ${dir}`);
    return;
  }
  await fs.mkdir(dir, { recursive: true });
}

async function removePath(target: string): Promise<void> {
  await fs.rm(target, { recursive: true });
}

async function ensureSymlink(spec: SymlinkSpec, ctx: Context): Promise<void> {
  await assertSourceExists(spec.source);
  await ensureDir(path.dirname(spec.target), ctx);

  const existing = await classifySymlink(spec);
  if (existing === "installed") return;
  if (existing === "conflict") {
    if (ctx.dryRun && !ctx.force) {
      console.log(
        `conflict ${spec.target} already exists and does not point to ${spec.source}`,
      );
      return;
    }
    if (!ctx.force) {
      throw new Error(
        `conflict: ${spec.target} already exists and does not point to ${spec.source}`,
      );
    }
    if (ctx.dryRun) {
      console.log(`remove-conflict ${spec.target}`);
    } else {
      await removePath(spec.target);
    }
  }

  if (ctx.dryRun) {
    console.log(`symlink ${spec.source} -> ${spec.target}`);
    return;
  }
  await fs.symlink(spec.source, spec.target, spec.targetKind);
}

async function removeManagedLink(
  spec: SymlinkSpec,
  ctx: Context,
): Promise<void> {
  const existing = await classifySymlink(spec);
  if (existing !== "installed") return;
  if (ctx.dryRun) {
    console.log(`remove ${spec.target}`);
    return;
  }
  await fs.unlink(spec.target);
}

async function assertSourceExists(source: string): Promise<void> {
  if (!(await pathExists(source))) {
    throw new Error(`required source missing: ${source}`);
  }
}

async function classifySymlink(spec: SymlinkSpec): Promise<ArtifactStatus> {
  let stat: Stats;
  try {
    stat = await fs.lstat(spec.target);
  } catch (error) {
    if (isNotFound(error)) return "missing";
    throw error;
  }

  if (!stat.isSymbolicLink()) return "conflict";

  try {
    const [targetReal, sourceReal] = await Promise.all([
      fs.realpath(spec.target),
      fs.realpath(spec.source),
    ]);
    return targetReal === sourceReal ? "installed" : "conflict";
  } catch {
    return "conflict";
  }
}

async function readJsonObject(
  filePath: string,
): Promise<Record<string, unknown>> {
  if (!(await pathExists(filePath))) return {};
  const raw = await fs.readFile(filePath, "utf8");
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`expected JSON object in ${filePath}`);
  }
  return parsed as Record<string, unknown>;
}

async function writeJsonObject(
  filePath: string,
  value: Record<string, unknown>,
  ctx: Context,
): Promise<void> {
  await ensureDir(path.dirname(filePath), ctx);
  if (ctx.dryRun) {
    console.log(`write-json ${filePath}`);
    return;
  }
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getConfigArray(
  config: Record<string, unknown>,
  key: string,
): unknown[] {
  const current = config[key];
  if (current === undefined) return [];
  if (
    !Array.isArray(current)
  ) {
    throw new Error(`expected ${key} to be an array`);
  }
  return [...current];
}

function entryPackage(entry: unknown): unknown {
  return entry && typeof entry === "object" && "package" in entry ? entry.package : entry;
}

async function ensureJsonArrayEntry(
  spec: JsonArraySpec,
  ctx: Context,
): Promise<void> {
  const config = await readJsonObject(spec.path);
  const entries = getConfigArray(config, spec.key);
  if (!entries.some(entry => entryPackage(entry) === spec.value)) {
    config[spec.key] = [...entries, spec.value];
    await writeJsonObject(spec.path, config, ctx);
  }
}

async function removeJsonArrayEntry(
  spec: JsonArraySpec,
  ctx: Context,
): Promise<void> {
  if (!(await pathExists(spec.path))) return;
  const config = await readJsonObject(spec.path);
  const entries = getConfigArray(config, spec.key);
  const next = entries.filter((entry) => entryPackage(entry) !== spec.value);
  if (next.length !== entries.length) {
    config[spec.key] = next;
    await writeJsonObject(spec.path, config, ctx);
  }
}

async function jsonArrayStatus(spec: JsonArraySpec): Promise<ArtifactStatus> {
  if (!(await pathExists(spec.path))) return "missing";
  const config = await readJsonObject(spec.path);
  const entries = getConfigArray(config, spec.key);
  return entries.some(entry => entryPackage(entry) === spec.value) ? "installed" : "missing";
}

async function listFiles(dir: string, suffix: string): Promise<string[]> {
  await assertSourceExists(dir);
  const result: string[] = [];
  for await (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(suffix)) result.push(entry.name);
  }
  result.sort();
  return result;
}

async function skillLinks(
  ctx: Context,
  targetRoot: string,
): Promise<SymlinkSpec[]> {
  const sourceDir = path.join(ctx.repoRoot, "skills");
  await assertSourceExists(sourceDir);
  const links: SymlinkSpec[] = [];
  for await (const entry of await fs.readdir(sourceDir, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const source = path.join(sourceDir, entry.name);
    if (!(await pathExists(path.join(source, "SKILL.md")))) continue;
    links.push({
      source,
      target: path.join(targetRoot, "skills", entry.name),
      targetKind: "dir",
    });
  }
  links.sort((left, right) => left.target.localeCompare(right.target));
  return links;
}

async function codexLinks(ctx: Context): Promise<SymlinkSpec[]> {
  return skillLinks(ctx, path.join(ctx.home, ".agents"));
}

async function codexAgentLinks(ctx: Context): Promise<SymlinkSpec[]> {
  const sourceDir = path.join(ctx.repoRoot, ".codex", "agents");
  const files = await listFiles(sourceDir, ".toml");
  return files.map((file) => ({
    source: path.join(sourceDir, file),
    target: path.join(ctx.home, ".codex", "agents", file),
    targetKind: "file" as const,
  }));
}

async function markdownAgentLinks(
  ctx: Context,
  targetRoot: string,
): Promise<SymlinkSpec[]> {
  const sourceDir = path.join(ctx.repoRoot, "agents");
  const files = await listFiles(sourceDir, ".md");
  return files.map((file) => ({
    source: path.join(sourceDir, file),
    target: path.join(targetRoot, "agents", file),
    targetKind: "file" as const,
  }));
}

function commonToolLinks(ctx: Context): SymlinkSpec[] {
  return [
    {
      source: path.join(ctx.repoRoot, "tools", "scip-query"),
      target: path.join(ctx.home, ".jj-superpowers", "tools", "scip-query"),
      targetKind: "file" as const,
    },
    {
      source: path.join(
        ctx.repoRoot,
        "skills",
        "jj-organizing-history",
        "resources",
        "dot-to-jj-dag",
        "dot-to-jj-dag.py",
      ),
      target: path.join(
        ctx.home,
        ".jj-superpowers",
        "tools",
        "dot-to-jj-dag.py",
      ),
      targetKind: "file" as const,
    },
  ];
}

async function applyLinks(links: SymlinkSpec[], ctx: Context): Promise<void> {
  for (const link of links) await ensureSymlink(link, ctx);
}

async function removeLinks(links: SymlinkSpec[], ctx: Context): Promise<void> {
  for (const link of links) await removeManagedLink(link, ctx);
}

async function statusForLinks(links: SymlinkSpec[]): Promise<ArtifactCheck[]> {
  const checks: ArtifactCheck[] = [];
  for (const link of links) {
    checks.push({
      label: path.basename(link.target),
      status: await classifySymlink(link),
      target: link.target,
      expected: link.source,
    });
  }
  return checks;
}

function aggregate(checks: ArtifactCheck[]): ArtifactStatus | "partial" {
  if (checks.every((check) => check.status === "installed")) return "installed";
  if (checks.every((check) => check.status === "missing")) return "missing";
  if (checks.some((check) => check.status === "conflict")) return "conflict";
  return "partial";
}

function claudePluginSpec(ctx: Context): SymlinkSpec {
  return {
    source: ctx.repoRoot,
    target: path.join(ctx.home, ".claude", "plugins", "jj-superpowers"),
    targetKind: "dir",
  };
}

function claudeSettingsSpec(ctx: Context): JsonArraySpec {
  return {
    path: path.join(ctx.home, ".claude", "settings.json"),
    key: "plugins",
    value: "~/.claude/plugins/jj-superpowers/.claude-plugin",
  };
}

function opencodeSpec(ctx: Context): JsonArraySpec {
  return {
    path: path.join(ctx.home, ".config", "opencode", "opencode.json"),
    key: "plugins",
    value: ctx.repoRoot,
  };
}

async function installOpenCodeConfig(ctx: Context): Promise<void> {
  const spec = opencodeSpec(ctx);
  const config = await readJsonObject(spec.path);
  const legacyManaged = `jj-superpowers@file:${ctx.repoRoot}`;
  const normalize = (entry: unknown): unknown => {
    if (entry === legacyManaged) return spec.value;
    if (Array.isArray(entry) && typeof entry[0] === "string") {
      return { package: entry[0] === legacyManaged ? spec.value : entry[0], options: entry[1] ?? {} };
    }
    if (entry && typeof entry === "object" && "package" in entry && entry.package === legacyManaged) {
      return { ...entry, package: spec.value };
    }
    return entry;
  };
  const entries = getConfigArray(config, "plugins").map(normalize);
  for (const entry of getConfigArray(config, "plugin").map(normalize)) {
    const managedAlreadyPresent = entryPackage(entry) === spec.value
      && entries.some(existing => entryPackage(existing) === spec.value);
    if (!managedAlreadyPresent && !entries.some(existing => JSON.stringify(existing) === JSON.stringify(entry))) entries.push(entry);
  }
  if (!entries.some(entry => entryPackage(entry) === spec.value)) entries.push(spec.value);
  config.plugins = entries;
  delete config.plugin;
  await writeJsonObject(spec.path, config, ctx);
}

async function commandExists(command: string): Promise<boolean> {
  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, command);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile() || stat.isSymbolicLink()) return true;
    } catch (error) {
      if (!(isNotFound(error))) throw error;
    }
  }
  return false;
}

async function runCommand(
  command: string,
  args: string[],
  ctx: Context,
): Promise<void> {
  if (ctx.dryRun) {
    console.log(`${command} ${args.join(" ")}`);
    return;
  }
  try {
    await execFileAsync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    const failure = error as Error & { stderr?: string; stdout?: string };
    throw new Error(`${command} ${args.join(" ")} failed: ${failure.stderr?.trim() || failure.stdout?.trim() || failure.message}`);
  }
}

async function fileHarnessLinks(
  ctx: Context,
  root: string,
): Promise<SymlinkSpec[]> {
  return [
    ...(await skillLinks(ctx, root)),
    ...(await markdownAgentLinks(ctx, root)),
    ...commonToolLinks(ctx),
  ];
}

const HARNESSES: Harness[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Register the local Claude plugin package.",
    async install(ctx) {
      await ensureSymlink(claudePluginSpec(ctx), ctx);
      await applyLinks(commonToolLinks(ctx), ctx);
      await ensureJsonArrayEntry(claudeSettingsSpec(ctx), ctx);
    },
    async uninstall(ctx) {
      await removeManagedLink(claudePluginSpec(ctx), ctx);
      await removeLinks(commonToolLinks(ctx), ctx);
      await removeJsonArrayEntry(claudeSettingsSpec(ctx), ctx);
    },
    async status(ctx) {
      const link = claudePluginSpec(ctx);
      const settings = claudeSettingsSpec(ctx);
      return [
        {
          label: "plugin",
          status: await classifySymlink(link),
          target: link.target,
          expected: link.source,
        },
        ...(await statusForLinks(commonToolLinks(ctx))),
        {
          label: "settings",
          status: await jsonArrayStatus(settings),
          target: settings.path,
          expected: settings.value,
        },
      ];
    },
  },
  {
    id: "codex",
    name: "Codex",
    description:
      "Link skills into ~/.agents and Codex TOML agents into ~/.codex.",
    async install(ctx) {
      await applyLinks(
        [
          ...(await codexLinks(ctx)),
          ...(await codexAgentLinks(ctx)),
          ...commonToolLinks(ctx),
        ],
        ctx,
      );
    },
    async uninstall(ctx) {
      await removeLinks(
        [
          ...(await codexLinks(ctx)),
          ...(await codexAgentLinks(ctx)),
          ...commonToolLinks(ctx),
        ],
        ctx,
      );
    },
    async status(ctx) {
      return statusForLinks([
        ...(await codexLinks(ctx)),
        ...(await codexAgentLinks(ctx)),
        ...commonToolLinks(ctx),
      ]);
    },
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Add the local package plugin reference to opencode.json.",
    async install(ctx) {
      await applyLinks(commonToolLinks(ctx), ctx);
      await installOpenCodeConfig(ctx);
    },
    async uninstall(ctx) {
      await removeLinks(commonToolLinks(ctx), ctx);
      await removeJsonArrayEntry(opencodeSpec(ctx), ctx);
      await removeJsonArrayEntry({ ...opencodeSpec(ctx), key: "plugin", value: `jj-superpowers@file:${ctx.repoRoot}` }, ctx);
    },
    async status(ctx) {
      const spec = opencodeSpec(ctx);
      return [
        {
          label: "plugin",
          status: await jsonArrayStatus(spec),
          target: spec.path,
          expected: spec.value,
        },
        ...(await statusForLinks(commonToolLinks(ctx))),
      ];
    },
  },
  {
    id: "oh-my-pi",
    name: "Oh My Pi",
    description:
      "Use omp plugin link when available, otherwise link skills and agents into ~/.omp/agent.",
    async install(ctx) {
      if (await commandExists("omp")) {
        await runCommand("omp", ["plugin", "link", ctx.repoRoot], ctx);
        return;
      }
      await applyLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".omp", "agent")),
        ctx,
      );
    },
    async uninstall(ctx) {
      await removeLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".omp", "agent")),
        ctx,
      );
    },
    async status(ctx) {
      return statusForLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".omp", "agent")),
      );
    },
  },
  {
    id: "pi",
    name: "Pi",
    description: "Link skills and agents into ~/.pi/agent.",
    async install(ctx) {
      await applyLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".pi", "agent")),
        ctx,
      );
    },
    async uninstall(ctx) {
      await removeLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".pi", "agent")),
        ctx,
      );
    },
    async status(ctx) {
      return statusForLinks(
        await fileHarnessLinks(ctx, path.join(ctx.home, ".pi", "agent")),
      );
    },
  },
  {
    id: "agy",
    name: "Agy / Antigravity",
    description: "Link skills and agents into ~/.gemini/antigravity.",
    async install(ctx) {
      await applyLinks(
        await fileHarnessLinks(
          ctx,
          path.join(ctx.home, ".gemini", "antigravity"),
        ),
        ctx,
      );
    },
    async uninstall(ctx) {
      await removeLinks(
        await fileHarnessLinks(
          ctx,
          path.join(ctx.home, ".gemini", "antigravity"),
        ),
        ctx,
      );
    },
    async status(ctx) {
      return statusForLinks(
        await fileHarnessLinks(
          ctx,
          path.join(ctx.home, ".gemini", "antigravity"),
        ),
      );
    },
  },
];

async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const ctx = context(args);
  const harnesses = selectedHarnesses(args);

  if (args.command === "list") {
    for (const harness of HARNESSES) {
      console.log(`${harness.id}\t${harness.name}\t${harness.description}`);
    }
    return;
  }

  if (args.command === "install") {
    for (const harness of harnesses) {
      await harness.install(ctx);
      console.log(
        ctx.dryRun
          ? `${harness.id} dry-run complete`
          : `${harness.id} installed`,
      );
    }
    return;
  }

  if (args.command === "uninstall") {
    for (const harness of harnesses) {
      await harness.uninstall(ctx);
      console.log(`${harness.id} uninstalled`);
    }
    return;
  }

  for (const harness of harnesses) {
    const checks = await harness.status(ctx);
    console.log(`${harness.id} ${aggregate(checks)}`);
    for (const check of checks) {
      const expected = check.expected ? ` expected=${check.expected}` : "";
      console.log(
        `  ${check.status}\t${check.label}\t${check.target}${expected}`,
      );
    }
  }
}

try {
  await run(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
