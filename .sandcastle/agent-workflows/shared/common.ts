import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as sandcastle from "@ai-hero/sandcastle";

export const outputDir = (): string => process.env.OUTPUT_DIR ?? "/tmp";

export const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
};

export const writeJson = (filename: string, value: unknown): void => {
  fs.mkdirSync(outputDir(), { recursive: true });
  fs.writeFileSync(
    path.join(outputDir(), filename),
    JSON.stringify(value, null, 2)
  );
};

// The one agent every factory workflow runs. It runs on GitHub Copilot and
// authenticates with the COPILOT_GITHUB_TOKEN secret (a fine-grained PAT with
// the "Copilot Requests" permission). The name `claudeAgent` is kept so the
// workflow call sites don't change.
//
// Sandcastle runs every agent with its permission checks skipped, so it can
// use any tool.
export const claudeAgent = () =>
  sandcastle.copilot("claude-opus-5-5", {
    env: {
      COPILOT_GITHUB_TOKEN: copilotToken(),
    },
  });

// CI sets COPILOT_GITHUB_TOKEN; locally, fall back to the `gh auth login` token.
const copilotToken = (): string => {
  if (process.env.COPILOT_GITHUB_TOKEN) return process.env.COPILOT_GITHUB_TOKEN;
  try {
    const token = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (token) return token;
  } catch {
    // fall through to the missing-var error
  }
  return required("COPILOT_GITHUB_TOKEN");
};
