import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { cancel, onUrl, start } from "@fabianlars/tauri-plugin-oauth";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CalendarClock, Link2, Shield, Sparkles, TimerReset } from "lucide-react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";
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
      throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
    }
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
      }
    });

    await openUrl(authUrl.toString());
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Calendar</p>
              <h3 className="mt-2 text-2xl font-semibold">Google account and today&apos;s events</h3>
            </div>
            <button className="button-secondary" onClick={() => void handleCalendarConnect()} type="button">
              <Link2 className="mr-2" size={16} />
              Connect Google
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
            <button className="button-secondary" onClick={() => void refreshContextSnapshot()} type="button">
              <TimerReset className="mr-2" size={16} />
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
              className="button-primary"
              disabled={!selectedTaskId}
              onClick={() => void suggestFocusSlots({ taskId: selectedTaskId, start: rangeStart, end: rangeEnd, preferredMinutes: minutes })}
              type="button"
            >
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
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Activity log</p>
        <h3 className="mt-2 text-2xl font-semibold">Stubbed until native tracker lands</h3>
        <div className="mt-4 space-y-3">
          {activityLog.map((segment) => (
            <div key={segment.id} className="rounded-2xl border border-ink/10 px-4 py-3 text-sm">
              {segment.appName ?? segment.processName ?? "Unknown app"} · {segment.privacyState}
            </div>
          ))}
          {!activityLog.length && (
            <div className="rounded-2xl bg-leaf/20 px-4 py-3 text-sm text-ink/70">
              Native active-window tracking is intentionally still stubbed in this slice. Privacy rules and empty-state plumbing are live.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
