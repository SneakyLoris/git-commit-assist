import * as vscode from "vscode";

const API_KEY_SECRET = "git-commit-assist.apiKey";

export class SecretStorageService implements vscode.Disposable {
  private readonly _onKeyStatusChange = new vscode.EventEmitter<boolean>();
  public readonly onKeyStatusChange: vscode.Event<boolean> =
    this._onKeyStatusChange.event;

  private readonly _changeSubscription: vscode.Disposable;

  constructor(private readonly secrets: vscode.SecretStorage) {
    this._changeSubscription = secrets.onDidChange(({ key }) => {
      if (key === API_KEY_SECRET) {
        void this.isConfigured().then((configured) =>
          this._onKeyStatusChange.fire(configured),
        );
      }
    });
  }

  async isConfigured(): Promise<boolean> {
    return (await this.secrets.get(API_KEY_SECRET)) !== undefined;
  }

  async getApiKey(): Promise<string | undefined> {
    return this.secrets.get(API_KEY_SECRET);
  }

  async storeApiKey(key: string): Promise<void> {
    await this.secrets.store(API_KEY_SECRET, key);
  }

  async deleteApiKey(): Promise<void> {
    await this.secrets.delete(API_KEY_SECRET);
  }

  async requireApiKey(): Promise<string | undefined> {
    const existing = await this.getApiKey();
    if (existing) {
      return existing;
    }

    const key = await vscode.window.showInputBox({
      title: "Git Commit Assist — API Key",
      prompt:
        "Enter your ProxyAPI key. Get one at proxyapi.ru if you don't have it.",
      password: true,
      placeHolder: "sk-...",
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) {
          return "API key cannot be empty";
        }
        if (value.trim().length < 10) {
          return "API key looks too short — double-check it";
        }
        return undefined;
      },
    });

    if (key) {
      const trimmed = key.trim();
      await this.storeApiKey(trimmed);
      vscode.window.showInformationMessage("Git Commit Assist: API key saved.");
      return trimmed;
    }

    return undefined;
  }

  dispose(): void {
    this._changeSubscription.dispose();
    this._onKeyStatusChange.dispose();
  }
}
