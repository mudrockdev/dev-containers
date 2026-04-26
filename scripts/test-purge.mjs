import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
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

function listComposeTemplates() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) =>
      existsSync(
        path.join(repoRoot, name, ".devcontainer", "docker-compose.yml"),
      ),
    )
    .sort();
}

function printUsage() {
  console.error("Usage: bun run ./scripts/test-purge.mjs");
  console.error("");
  console.error(
    "Stops and removes every compose project created by bun run test.",
  );
}

function sanitizeName(value) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(" ");
  console.error(`$ ${printable}`);

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status !== 0) {
    throw new CommandError([command, ...args], status);
  }
}

function downComposeTemplate(templateName) {
  const templateDir = path.join(repoRoot, templateName);
  const projectName = `devcontainer-test-${sanitizeName(templateName)}`;
  const composeFile = path.join(
    templateDir,
    ".devcontainer",
    "docker-compose.yml",
  );

  run("podman", [
    "compose",
    "-p",
    projectName,
    "-f",
    composeFile,
    "down",
    "-v",
    "--remove-orphans",
  ]);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (args.length > 0) {
  printUsage();
  process.exit(1);
}

const templates = listComposeTemplates();
if (templates.length === 0) {
  console.error("No compose templates found.");
  process.exit(0);
}

let failed = false;
for (const templateName of templates) {
  try {
    downComposeTemplate(templateName);
  } catch (error) {
    failed = true;
    if (error instanceof CommandError) {
      console.error(`Failed to purge ${templateName}: ${error.message}`);
      continue;
    }

    throw error;
  }
}

if (failed) {
  process.exit(1);
}
