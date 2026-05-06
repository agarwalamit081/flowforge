import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";
import { api } from "../lib/tauri";
import type { AiUsageStats } from "../types/domain";

interface SettingsValues {
  theme: "system" | "light" | "dark";
  accentColor: string;
  morningBriefingEnabled: boolean;
  defaultFocusMinutes: number;
  defaultAiProvider: string;
  defaultAiModel: string;
  aiEnabled: boolean;
}

interface AiConfigValues {
  provider: string;
  model: string;
  apiKey: string;
}

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-haiku-4.5", "claude-sonnet-4.6"] },
  { value: "deepseek", label: "DeepSeek", models: ["deepseek-reasoner", "deepseek-chat"] },
  { value: "zai", label: "Z.AI", models: ["GLM-4.7-Flash"] },
  { value: "minimax", label: "MiniMax", models: ["MiniMax-M2.5-highspeed"] },
  { value: "mistral", label: "Mistral", models: ["mistral-large-latest"] },
] as const;

export function SettingsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { settings, loadSettings, updateSettings, exportUserData, purgeUserData } = useFlowForgeStore();
  const { register: registerSettings, handleSubmit: handleSubmitSettings, reset: resetSettings } = useForm<SettingsValues>();
  const { register: registerAi, handleSubmit: handleSubmitAi, reset: resetAi, watch } = useForm<AiConfigValues>();
  const [exportPreview, setExportPreview] = useState<string>("");
  const [aiUsageStats, setAiUsageStats] = useState<AiUsageStats | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const selectedProvider = watch("provider");

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      resetSettings(settings);
      resetAi({
        provider: settings.defaultAiProvider,
        model: settings.defaultAiModel,
        apiKey: "",
      });
    }
  }, [resetSettings, resetAi, settings]);

  useEffect(() => {
    // Load AI usage stats for the current month
    const loadAiUsageStats = async () => {
      const currentDate = new Date(today);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
      const stats = await api.getAiUsageStats({ start: startOfMonth, end: today });
      setAiUsageStats(stats);
    };
    void loadAiUsageStats();
  }, [today]);

  return (
    <div className="grid max-w-5xl gap-6 xl:grid-cols-[1fr_360px]">
      <form className="card space-y-4" onSubmit={handleSubmitSettings(async (values) => updateSettings(values))}>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold">Local defaults</h2>
        </div>
        <select className="input" {...registerSettings("theme")}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <input className="input h-12 p-1" type="color" {...registerSettings("accentColor")} />
        <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm">
          <input type="checkbox" {...registerSettings("morningBriefingEnabled")} />
          Enable morning briefing
        </label>
        <input className="input" min={5} step={5} type="number" {...registerSettings("defaultFocusMinutes", { valueAsNumber: true })} />
        <button className="button-primary" type="submit">
          Save settings
        </button>
      </form>

      {/* AI Configuration Section */}
      <form className="card space-y-4" onSubmit={handleSubmitAi(async (values) => {
        await updateSettings({
          defaultAiProvider: values.provider,
          defaultAiModel: values.model,
        });
      })}>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">AI & Intelligence</p>
          <h2 className="mt-2 text-3xl font-semibold">AI Configuration</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <select className="input" {...registerAi("provider")}>
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <select className="input" {...registerAi("model")}>
            {AI_PROVIDERS.find(p => p.value === selectedProvider)?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="password"
              placeholder="sk-..."
              {...registerAi("apiKey")}
            />
            <button
              className="button-secondary"
              type="button"
              onClick={async () => {
                const apiKey = watch("apiKey");
                if (!apiKey) return;
                setTestingConnection(true);
                setConnectionStatus("idle");
                try {
                  const valid = await api.testAiConnection({
                    provider: watch("provider"),
                    model: watch("model"),
                    apiKey,
                  });
                  setConnectionStatus(valid ? "success" : "error");
                } catch {
                  setConnectionStatus("error");
                } finally {
                  setTestingConnection(false);
                }
              }}
              disabled={testingConnection || !watch("apiKey")}
            >
              {testingConnection ? "Testing..." : "Test"}
            </button>
          </div>
          {connectionStatus === "success" && (
            <p className="text-sm text-green-600">Connection successful!</p>
          )}
          {connectionStatus === "error" && (
            <p className="text-sm text-red-600">Connection failed. Please check your API key.</p>
          )}
        </div>

        <button className="button-primary" type="submit">
          Save AI settings
        </button>
      </form>

      {/* AI Usage Statistics */}
      <div className="card space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">AI Usage</p>
          <h2 className="mt-2 text-2xl font-semibold">This Month</h2>
        </div>
        {aiUsageStats ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink-light">Requests</p>
              <p className="text-2xl font-semibold">{aiUsageStats.requestCount}</p>
            </div>
            <div>
              <p className="text-ink-light">Cost</p>
              <p className="text-2xl font-semibold">${(aiUsageStats.totalCostCents / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-ink-light">Input tokens</p>
              <p className="text-lg font-semibold">{aiUsageStats.totalInputTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-ink-light">Output tokens</p>
              <p className="text-lg font-semibold">{aiUsageStats.totalOutputTokens.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-ink-light">Avg latency</p>
              <p className="text-lg font-semibold">{aiUsageStats.avgLatencyMs.toFixed(0)}ms</p>
            </div>
          </div>
        ) : (
          <p className="text-ink-light">No AI usage this month.</p>
        )}
        <button
          className="button-secondary text-coral hover:bg-coral/10"
          onClick={async () => {
            if (window.confirm("Delete all AI-generated content and usage history? This cannot be undone.")) {
              await api.deleteAiData();
              setAiUsageStats(null);
            }
          }}
          type="button"
        >
          Delete AI data
        </button>
      </div>

      <section className="space-y-6">
        <div className="card space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-moss">Data tools</p>
            <h3 className="mt-2 text-2xl font-semibold">Export or reset local data</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              onClick={async () => {
                const bundle = await exportUserData();
                const content = JSON.stringify(bundle, null, 2);
                setExportPreview(content);
                const path = await save({
                  defaultPath: `flowforge-export-${today}.json`,
                  filters: [{ name: "JSON", extensions: ["json"] }]
                });
                if (path) {
                  await writeTextFile(path, content);
                }
              }}
              type="button"
            >
              Download export
            </button>
            <button
              className="button-primary bg-coral hover:bg-coral/90"
              onClick={async () => {
                if (window.confirm("Purge all local FlowForge data? This cannot be undone.")) {
                  await purgeUserData(today);
                  setExportPreview("");
                }
              }}
              type="button"
            >
              Purge local data
            </button>
          </div>
        </div>

        <div className="card">
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Latest export preview</p>
          <textarea
            className="input mt-4 min-h-72 font-mono text-xs"
            readOnly
            value={exportPreview || "Run an export to inspect the JSON bundle here."}
          />
        </div>
      </section>
    </div>
  );
}
