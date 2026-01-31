import * as z from "zod/v4";

export const AIModelSchema = z.enum([
  // claude code
  "opus",
  "sonnet",
  "haiku",

  // amp
  "amp",

  // codex (openai)
  "gpt-5",
  "gpt-5-low",
  "gpt-5-high",
  "gpt-5-codex-low",
  "gpt-5-codex-medium",
  "gpt-5-codex-high",
  "gpt-5.2-low",
  "gpt-5.2",
  "gpt-5.2-high",
  "gpt-5.2-xhigh",
  "gpt-5.1",
  "gpt-5.1-low",
  "gpt-5.1-high",
  "gpt-5.1-codex-low",
  "gpt-5.1-codex-medium",
  "gpt-5.1-codex-high",
  "gpt-5.1-codex-max",
  "gpt-5.1-codex-max-low",
  "gpt-5.1-codex-max-high",
  "gpt-5.1-codex-max-xhigh",
  "gpt-5.2-codex-low",
  "gpt-5.2-codex-medium",
  "gpt-5.2-codex-high",
  "gpt-5.2-codex-xhigh",
]);

// Augment AIModelSchema with simpler names for external usage
export const AIModelExternalSchema = z.enum([
  ...AIModelSchema.options,
  "gpt-5-medium",
  "gpt-5.1-medium",
  "gpt-5.2-medium",
  "gpt-5-codex",
  "gpt-5.1-codex",
  "gpt-5.1-codex-max-medium",
  "gpt-5.2-codex",
]);

export type AIModel = z.infer<typeof AIModelSchema>;
export type AIModelExternal = z.infer<typeof AIModelExternalSchema>;

export const AIAgentSchema = z.enum(["claudeCode", "amp", "codex"]);

export type AIAgent = z.infer<typeof AIAgentSchema>;

export type AIAgentCredentials =
  | { type: "env-var"; key: string; value: string }
  | { type: "json-file"; contents: string }
  | { type: "built-in-credits" };

export type AIAgentSlashCommand = {
  name: string;
  description: string;
  isLoading?: boolean;
};

export type SelectedAIModels = {
  [model in AIModel]?: number;
};

export type AgentModelPreferences = {
  agents?: { [agent in AIAgent]?: boolean };
  models?: { [model in AIModel]?: boolean };
};
