#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

const POSIX_SEPARATOR = "/";

const path = {
  delimiter: ":",
  basename(value: string): string {
    const normalized = value.replace(/\/+$/, "");
    const lastSeparator = normalized.lastIndexOf(POSIX_SEPARATOR);
    return lastSeparator === -1
      ? normalized
      : normalized.slice(lastSeparator + 1);
  },
  dirname(value: string): string {
    const normalized = value.replace(/\/+$/, "");
    const lastSeparator = normalized.lastIndexOf(POSIX_SEPARATOR);
    if (lastSeparator <= 0) return POSIX_SEPARATOR;
    return normalized.slice(0, lastSeparator);
  },
  join(...parts: string[]): string {
    return normalizePath(
      parts.filter((part) => part.length > 0).join(POSIX_SEPARATOR),
    );
  },
  resolve(...parts: string[]): string {
    const joined = parts.some((part) => part.startsWith(POSIX_SEPARATOR))
      ? parts.join(POSIX_SEPARATOR)
      : `${Deno.cwd()}${POSIX_SEPARATOR}${parts.join(POSIX_SEPARATOR)}`;
    return normalizePath(joined);
  },
};

function normalizePath(value: string): string {
  const absolute = value.startsWith(POSIX_SEPARATOR);
  const segments: string[] = [];
  for (const segment of value.split(/\/+/)) {
    if (segment.length === 0 || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return `${absolute ? POSIX_SEPARATOR : ""}${
    segments.join(POSIX_SEPARATOR)
  }` || POSIX_SEPARATOR;
}

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

const SCRIPT_DIR = path.dirname(decodeURI(new URL(import.meta.url).pathname));
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
  return `Usage: deno run -A scripts/install-harnesses.ts <list|status|install|uninstall> [options]\n\nOptions:\n  --harness <id>  Select a harness; repeat for multiple harnesses\n  --all           Select all harnesses\n  --dry-run       Print operations without writing files\n  --force         Replace conflicting install targets\n  --repo <path>   Repository root (defaults to this checkout)\n`;
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
  return value === "list" || value === "status" || value === "install" ||
    value === "uninstall";
}

function isHarnessId(value: string): value is HarnessId {
  return (HARNESS_IDS as string[]).includes(value);
}

function context(args: ParsedArgs): Context {
  const home = Deno.env.get("HOME");
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
    await Deno.lstat(target);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function ensureDir(dir: string, ctx: Context): Promise<void> {
  if (ctx.dryRun) {
    console.log(`ensure-dir ${dir}`);
    return;
  }
  await Deno.mkdir(dir, { recursive: true });
}

async function removePath(target: string): Promise<void> {
  await Deno.remove(target, { recursive: true });
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
  await Deno.symlink(spec.source, spec.target, { type: spec.targetKind });
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
  await Deno.remove(spec.target);
}

async function assertSourceExists(source: string): Promise<void> {
  if (!(await pathExists(source))) {
    throw new Error(`required source missing: ${source}`);
  }
}

async function classifySymlink(spec: SymlinkSpec): Promise<ArtifactStatus> {
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.lstat(spec.target);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return "missing";
    throw error;
  }

  if (!stat.isSymlink) return "conflict";

  try {
    const [targetReal, sourceReal] = await Promise.all([
      Deno.realPath(spec.target),
      Deno.realPath(spec.source),
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
  const raw = await Deno.readTextFile(filePath);
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
  await Deno.writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getStringArray(
  config: Record<string, unknown>,
  key: string,
): string[] {
  const current = config[key];
  if (current === undefined) return [];
  if (
    !Array.isArray(current) || current.some((item) => typeof item !== "string")
  ) {
    throw new Error(`expected ${key} to be an array of strings`);
  }
  return [...current] as string[];
}

async function ensureJsonArrayEntry(
  spec: JsonArraySpec,
  ctx: Context,
): Promise<void> {
  const config = await readJsonObject(spec.path);
  const entries = getStringArray(config, spec.key);
  if (!entries.includes(spec.value)) {
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
  const entries = getStringArray(config, spec.key);
  const next = entries.filter((entry) => entry !== spec.value);
  if (next.length !== entries.length) {
    config[spec.key] = next;
    await writeJsonObject(spec.path, config, ctx);
  }
}

async function jsonArrayStatus(spec: JsonArraySpec): Promise<ArtifactStatus> {
  if (!(await pathExists(spec.path))) return "missing";
  const config = await readJsonObject(spec.path);
  const entries = getStringArray(config, spec.key);
  return entries.includes(spec.value) ? "installed" : "missing";
}

async function listFiles(dir: string, suffix: string): Promise<string[]> {
  await assertSourceExists(dir);
  const result: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(suffix)) result.push(entry.name);
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
  for await (const entry of Deno.readDir(sourceDir)) {
    if (!entry.isDirectory && !entry.isSymlink) continue;
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
    key: "plugin",
    value: `jj-superpowers@file:${ctx.repoRoot}`,
  };
}

async function commandExists(command: string): Promise<boolean> {
  const pathEnv = Deno.env.get("PATH") ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, command);
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isFile || stat.isSymlink) return true;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
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
  const result = await new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    const stdout = new TextDecoder().decode(result.stdout).trim();
    throw new Error(`${command} ${args.join(" ")} failed: ${stderr || stdout}`);
  }
}

async function fileHarnessLinks(
  ctx: Context,
  root: string,
): Promise<SymlinkSpec[]> {
  return [
    ...(await skillLinks(ctx, root)),
    ...(await markdownAgentLinks(ctx, root)),
  ];
}

const HARNESSES: Harness[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Register the local Claude plugin package.",
    async install(ctx) {
      await ensureSymlink(claudePluginSpec(ctx), ctx);
      await ensureJsonArrayEntry(claudeSettingsSpec(ctx), ctx);
    },
    async uninstall(ctx) {
      await removeManagedLink(claudePluginSpec(ctx), ctx);
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
        [...(await codexLinks(ctx)), ...(await codexAgentLinks(ctx))],
        ctx,
      );
    },
    async uninstall(ctx) {
      await removeLinks(
        [...(await codexLinks(ctx)), ...(await codexAgentLinks(ctx))],
        ctx,
      );
    },
    async status(ctx) {
      return statusForLinks([
        ...(await codexLinks(ctx)),
        ...(await codexAgentLinks(ctx)),
      ]);
    },
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Add the local package plugin reference to opencode.json.",
    async install(ctx) {
      await ensureJsonArrayEntry(opencodeSpec(ctx), ctx);
    },
    async uninstall(ctx) {
      await removeJsonArrayEntry(opencodeSpec(ctx), ctx);
    },
    async status(ctx) {
      const spec = opencodeSpec(ctx);
      return [{
        label: "plugin",
        status: await jsonArrayStatus(spec),
        target: spec.path,
        expected: spec.value,
      }];
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
  await run(Deno.args);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  Deno.exit(1);
}
