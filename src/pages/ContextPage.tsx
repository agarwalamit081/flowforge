import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { cancel, onUrl, start } from "@fabianlars/tauri-plugin-oauth";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CalendarClock, Link2, Shield, Sparkles, TimerReset, Eye, Loader2, AlertCircle } from "lucide-react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";
import { EmptyState } from "../components/EmptyState";
import type { ContextSnapshot } from "../types/domain";

function todayRange() {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  return {
    date,
    start: `${date}T00:00:00.000Z`,
    end: `${date}T23:59:59.999Z`
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

async function createPkceChallenge(verifier: string) {
  const bytes = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomVerifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ContextPage() {
  const { date, start: rangeStart, end: rangeEnd } = useMemo(() => todayRange(), []);
  const {
    tasks,
    calendarAccounts,
    calendarEvents,
    focusBlocks,
    monitoringRules,
    activityLog,
    contextSnapshot,
    focusSuggestions,
    error,
    loading,
    loadTasks,
    loadContextWorkspace,
    connectGoogleCalendar,
    disconnectCalendar,
    refreshContextSnapshot,
    suggestFocusSlots,
    createFocusBlock,
    setFocusBlockStatus,
    createMonitoringRule,
    deleteMonitoringRule
  } = useFlowForgeStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [minutes, setMinutes] = useState<number>(45);
  const [rulePattern, setRulePattern] = useState("");
  const [ruleType, setRuleType] = useState("domain");
  const [ruleAction, setRuleAction] = useState<"allow" | "redact_title" | "deny">("redact_title");
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    void Promise.all([loadTasks(), loadContextWorkspace(date)]);
  }, [date, loadContextWorkspace, loadTasks]);

  useEffect(() => {
    let unlistenContext: (() => void) | undefined;
    void listen<ContextSnapshot>("context-update", (event) => {
      useFlowForgeStore.setState({ contextSnapshot: event.payload });
    }).then((fn) => {
      unlistenContext = fn;
    });
    return () => {
      unlistenContext?.();
    };
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  async function handleCalendarConnect() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Calendar is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.");
      return;
    }
    setConnecting(true);
    try {
      const verifier = randomVerifier();
      const challenge = await createPkceChallenge(verifier);
      const port = await start();
      const redirectUri = `http://127.0.0.1:${port}`;
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/calendar.readonly");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      const unlisten = await onUrl(async (receivedUrl) => {
        try {
          const parsed = new URL(receivedUrl);
          const authorizationCode = parsed.searchParams.get("code");
          if (!authorizationCode) {
            throw new Error("Google redirect did not include an authorization code.");
          }
          await connectGoogleCalendar({ authorizationCode, redirectUri, codeVerifier: verifier }, date);
        } finally {
          await cancel(port);
          unlisten();
          setConnecting(false);
        }
      });

      await openUrl(authUrl.toString());
    } catch {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card bg-ink text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-leaf">Context</p>
        <h2 className="mt-2 text-3xl font-semibold">Calendar, focus, and privacy live in one loop.</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/80">
          Phase 2 adds calendar context, focus blocks, and privacy rules without turning on raw activity capture yet.
        </p>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="mt-0.5 size-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Calendar</p>
              <h3 className="mt-2 text-2xl font-semibold">Google account and today&apos;s events</h3>
            </div>
            <button
              className="button-secondary flex items-center gap-2"
              disabled={connecting}
              onClick={handleCalendarConnect}
              type="button"
            >
              {connecting ? <Loader2 className="animate-spin" size={16} /> : <Link2 size={16} />}
              {connecting ? "Connecting..." : "Connect Google"}
            </button>
          </div>
          {!!calendarAccounts.length && (
            <div className="space-y-3">
              {calendarAccounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-ink/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{account.displayName ?? account.email}</div>
                      <div className="text-sm text-ink/60">
                        Synced {account.lastSyncedAt ? formatDateTime(account.lastSyncedAt) : "not yet"}
                      </div>
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => void disconnectCalendar(account.id, date)}
                      type="button"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {calendarEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-ink/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5" size={18} />
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-ink/60">
                      {formatDateTime(event.startsAt)} to {formatDateTime(event.endsAt)}
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-moss">{event.busyStatus}</div>
                  </div>
                </div>
              </div>
            ))}
            {!calendarEvents.length && <div className="text-sm text-ink/60">No cached events yet.</div>}
          </div>
        </section>

        <section className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles size={18} />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-moss">Context state</p>
                <h3 className="mt-1 text-2xl font-semibold">{contextSnapshot?.state.replaceAll("_", " ") ?? "Loading"}</h3>
              </div>
            </div>
            <p className="text-sm text-ink/70">{contextSnapshot?.activitySummary ?? "No snapshot yet."}</p>
            {contextSnapshot?.nudge && <div className="rounded-2xl bg-leaf/20 px-4 py-3 text-sm">{contextSnapshot.nudge}</div>}
            <button
              className="button-secondary flex items-center gap-2"
              disabled={refreshing || loading}
              onClick={async () => {
                setRefreshing(true);
                try {
                  await refreshContextSnapshot();
                } finally {
                  setRefreshing(false);
                }
              }}
              type="button"
            >
              {refreshing || loading ? <Loader2 className="animate-spin" size={16} /> : <TimerReset size={16} />}
              Refresh snapshot
            </button>
          </div>

          <div className="card space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Focus assistant</p>
              <h3 className="mt-2 text-2xl font-semibold">Suggest a focus block</h3>
            </div>
            <select className="input" onChange={(event) => setSelectedTaskId(event.target.value)} value={selectedTaskId}>
              <option value="">Pick a task</option>
              {tasks
                .filter((task) => task.status !== "archived" && task.status !== "done")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            <input
              className="input"
              min={15}
              onChange={(event) => setMinutes(Number(event.target.value))}
              step={15}
              type="number"
              value={minutes}
            />
            <button
              className="button-primary flex items-center gap-2"
              disabled={!selectedTaskId || suggesting || loading}
              onClick={async () => {
                setSuggesting(true);
                try {
                  await suggestFocusSlots({ taskId: selectedTaskId, start: rangeStart, end: rangeEnd, preferredMinutes: minutes });
                } finally {
                  setSuggesting(false);
                }
              }}
              type="button"
            >
              {suggesting || loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Find focus slots
            </button>
            <div className="space-y-3">
              {focusSuggestions.map((suggestion) => (
                <div key={suggestion.startsAt} className="rounded-2xl border border-ink/10 px-4 py-3">
                  <div className="font-medium">
                    {formatDateTime(suggestion.startsAt)} for {suggestion.durationMinutes} min
                  </div>
                  <div className="mt-1 text-sm text-ink/60">{suggestion.reason}</div>
                  <button
                    className="button-secondary mt-3"
                    onClick={() =>
                      void createFocusBlock(
                        {
                          taskId: selectedTaskId,
                          title: selectedTask?.title ?? "Focus block",
                          startsAt: suggestion.startsAt,
                          endsAt: suggestion.endsAt,
                          createdBy: "suggested"
                        },
                        date
                      )
                    }
                    type="button"
                  >
                    Create focus block
                  </button>
                </div>
              ))}
              {!focusSuggestions.length && <div className="text-sm text-ink/60">No slot suggestions requested yet.</div>}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="card space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-moss">Focus blocks</p>
            <h3 className="mt-2 text-2xl font-semibold">Today&apos;s planned work windows</h3>
          </div>
          <div className="space-y-3">
            {focusBlocks.map((block) => (
              <div key={block.id} className="rounded-2xl border border-ink/10 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{block.title}</div>
                    <div className="text-sm text-ink/60">
                      {formatDateTime(block.startsAt)} to {formatDateTime(block.endsAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {block.status !== "active" && block.status !== "completed" && (
                      <button
                        className="button-secondary"
                        onClick={() => void setFocusBlockStatus(block.id, "active", date)}
                        type="button"
                      >
                        Start
                      </button>
                    )}
                    {block.status !== "completed" && (
                      <button
                        className="button-secondary"
                        onClick={() => void setFocusBlockStatus(block.id, "completed", date)}
                        type="button"
                      >
                        Complete
                      </button>
                    )}
                    {block.status !== "cancelled" && (
                      <button
                        className="button-secondary"
                        onClick={() => void setFocusBlockStatus(block.id, "cancelled", date)}
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!focusBlocks.length && <div className="text-sm text-ink/60">No focus blocks yet.</div>}
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center gap-3">
            <Shield size={18} />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Privacy rules</p>
              <h3 className="mt-1 text-2xl font-semibold">Monitoring guardrails</h3>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[140px_1fr_160px_auto]">
            <select className="input" onChange={(event) => setRuleType(event.target.value)} value={ruleType}>
              <option value="domain">Domain</option>
              <option value="app">App</option>
            </select>
            <input
              className="input"
              onChange={(event) => setRulePattern(event.target.value)}
              placeholder="mail.google.com or 1Password"
              value={rulePattern}
            />
            <select
              className="input"
              onChange={(event) => setRuleAction(event.target.value as "allow" | "redact_title" | "deny")}
              value={ruleAction}
            >
              <option value="redact_title">Redact title</option>
              <option value="deny">Deny</option>
              <option value="allow">Allow</option>
            </select>
            <button
              className="button-primary"
              disabled={!rulePattern.trim()}
              onClick={() => {
                void createMonitoringRule({
                  ruleType,
                  pattern: rulePattern.trim(),
                  action: ruleAction,
                  reason: "Added from FlowForge Context page."
                });
                setRulePattern("");
              }}
              type="button"
            >
              Add rule
            </button>
          </div>
          <div className="space-y-3">
            {monitoringRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-ink/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{rule.pattern}</div>
                    <div className="text-sm text-ink/60">
                      {rule.ruleType} · {rule.action}
                    </div>
                  </div>
                  <button className="button-secondary" onClick={() => void deleteMonitoringRule(rule.id)} type="button">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-moss">Activity log</p>
            <h3 className="mt-2 text-2xl font-semibold">Window and app tracking</h3>
          </div>
          {activityLog.length > 0 && (
            <div className="text-sm text-ink/60">
              {activityLog.length} segments tracked
            </div>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {activityLog.map((segment) => {
            const isDenied = segment.privacyState === "denied";
            const isRedacted = segment.privacyState === "redacted_title";
            const isAllowed = segment.privacyState === "allowed";

            return (
              <div
                key={segment.id}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  isDenied ? "border-coral/30 bg-coral/10" : "border-ink/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {segment.appName ?? segment.processName ?? "Unknown app"}
                      </span>
                      {isDenied && (
                        <span className="rounded-full bg-coral/20 px-2 py-0.5 text-xs text-coral">Blocked</span>
                      )}
                      {isRedacted && (
                        <span className="rounded-full bg-moss/20 px-2 py-0.5 text-xs text-moss">Redacted</span>
                      )}
                      {isAllowed && (
                        <span className="rounded-full bg-leaf/20 px-2 py-0.5 text-xs text-leaf">Allowed</span>
                      )}
                    </div>
                    {segment.windowTitleRedacted && (
                      <div className="mt-1 text-xs text-ink/60">{segment.windowTitleRedacted}</div>
                    )}
                    {segment.domain && (
                      <div className="mt-1 text-xs text-ink/60">🌐 {segment.domain}</div>
                    )}
                    <div className="mt-2 text-xs text-ink/50">
                      {formatDateTime(segment.startedAt)} → {formatDateTime(segment.endedAt)} · {segment.durationSeconds}s
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!activityLog.length && (
            <EmptyState
              icon={Eye}
              title="Activity tracking ready"
              description="Active window tracking is configured. Privacy rules are in place to protect sensitive apps and domains."
              variant="default"
            />
          )}
        </div>
      </section>
    </div>
  );
}
