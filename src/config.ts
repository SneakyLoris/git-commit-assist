import * as vscode from "vscode";

export interface ExtensionConfig {
  model: string;
  maxOutputTokens: number;
  context7Enabled: boolean;
  responseLanguage: string;
  docsDirectory: string;
}

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration("gitCommitAssist");
  return {
    model: cfg.get<string>("model", "gemini-3.1-flash-lite-preview"),
    maxOutputTokens: cfg.get<number>("maxOutputTokens", 0),
    context7Enabled: cfg.get<boolean>("context7Enabled", true),
    responseLanguage: cfg.get<string>("responseLanguage", "Russian"),
    docsDirectory: cfg.get<string>("docsDirectory", "docs/**/*.md"),
  };
}
