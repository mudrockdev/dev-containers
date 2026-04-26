import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

class CommandError extends Error {
  constructor(command, status) {
    super(`Command failed with exit code ${status}: ${command.join(" ")}`);
    this.name = "CommandError";
    this.status = status;
  }
}

function listTemplates() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(path.join(repoRoot, name, ".devcontainer", "devcontainer.json")))
    .sort();
}

function printUsage() {
  const templates = listTemplates();
  console.error("Usage: bun run test <template> [-- <command>]");
  console.error("");
  console.error("Examples:");
  console.error("  bun run test debian13-bun");
  console.error("  bun run test ubuntu2604-bun-postgresql -- psql --version");
  console.error("");
  console.error("Available templates:");
  for (const template of templates) {
    console.error(`  - ${template}`);
  }
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function sanitizeName(value) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(" ");
  console.error(`$ ${printable}`);

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status !== 0) {
    throw new CommandError([command, ...args], status);
  }
}

function runSoft(command, args, options = {}) {
  try {
    run(command, args, options);
  } catch (error) {
    if (error instanceof CommandError) {
      console.error(`Cleanup command failed: ${error.message}`);
      return;
    }

    throw error;
  }
}

function readDevcontainerConfig(templateDir, templateName) {
  const configPath = path.join(templateDir, ".devcontainer", "devcontainer.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const workspaceFolder = (config.workspaceFolder || `/workspaces/${templateName}`)
    .replaceAll("${localWorkspaceFolderBasename}", templateName);

  return {
    config,
    workspaceFolder
  };
}

function buildShellCommand(workspaceFolder, commandArgs) {
  if (commandArgs.length === 0) {
    return `cd ${shellQuote(workspaceFolder)} && exec bash -l`;
  }

  const joined = commandArgs.map(shellQuote).join(" ");
  return `cd ${shellQuote(workspaceFolder)} && exec ${joined}`;
}

function runComposeTemplate(templateName, templateDir, workspaceFolder, commandArgs) {
  const projectName = `devcontainer-test-${sanitizeName(templateName)}`;
  const composeFile = path.join(templateDir, ".devcontainer", "docker-compose.yml");
  const composeArgs = ["compose", "-p", projectName, "-f", composeFile];
  const shellCommand = buildShellCommand(workspaceFolder, commandArgs);
  const execArgs = commandArgs.length === 0
    ? [...composeArgs, "exec", "devcontainer", "bash", "-lc", shellCommand]
    : [...composeArgs, "exec", "-T", "devcontainer", "bash", "-lc", shellCommand];

  run("podman", [...composeArgs, "up", "-d", "--build"]);

  try {
    run("podman", execArgs);
  } finally {
    runSoft("podman", [...composeArgs, "down", "-v"]);
  }
}

function runDockerfileTemplate(templateName, templateDir, workspaceFolder, commandArgs) {
  const imageTag = `localhost/devcontainer-test:${templateName}`;
  const containerName = `devcontainer-test-${sanitizeName(templateName)}-${Date.now()}`;
  const dockerfilePath = path.join(templateDir, ".devcontainer", "Dockerfile");
  const shellCommand = commandArgs.length === 0
    ? "exec bash -l"
    : `exec ${commandArgs.map(shellQuote).join(" ")}`;
  const runArgs = [
    "run",
    "--rm",
    "--name",
    containerName,
    "--userns=keep-id",
    "-v",
    `${templateDir}:${workspaceFolder}`,
    "-w",
    workspaceFolder
  ];

  if (commandArgs.length === 0) {
    runArgs.push("-it");
  }

  run("podman", ["build", "-t", imageTag, "-f", dockerfilePath, templateDir]);
  run("podman", [...runArgs, imageTag, "bash", "-lc", shellCommand]);
}

const args = process.argv.slice(2);
const templateName = args[0];
const commandArgs = args.slice(1);

if (!templateName || templateName === "--help" || templateName === "-h") {
  printUsage();
  process.exit(templateName ? 0 : 1);
}

const templateDir = path.join(repoRoot, templateName);
if (!existsSync(templateDir)) {
  console.error(`Unknown template: ${templateName}`);
  console.error("");
  printUsage();
  process.exit(1);
}

const dockerfilePath = path.join(templateDir, ".devcontainer", "Dockerfile");
const composeFilePath = path.join(templateDir, ".devcontainer", "docker-compose.yml");
if (!existsSync(dockerfilePath)) {
  console.error(`Template is missing ${path.relative(repoRoot, dockerfilePath)}`);
  process.exit(1);
}

const { workspaceFolder } = readDevcontainerConfig(templateDir, templateName);

if (existsSync(composeFilePath)) {
  runComposeTemplate(templateName, templateDir, workspaceFolder, commandArgs);
} else {
  runDockerfileTemplate(templateName, templateDir, workspaceFolder, commandArgs);
}
