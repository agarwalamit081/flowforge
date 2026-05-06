import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Inbox, Archive, RotateCcw, AlertCircle } from "lucide-react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatForDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(localValue: string) {
  return new Date(localValue).toISOString();
}

function tomorrowAtFive(date: string) {
  const tomorrow = new Date(`${date}T17:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString();
}

interface AgendaTaskCardProps {
  task: ReturnType<typeof useFlowForgeStore.getState>["tasks"][number];
  date: string;
  variant: "inbox" | "planned";
  onOpen: (taskId: string) => Promise<void>;
  onSchedule: (taskId: string, dueAt: string) => Promise<void>;
  onUnschedule: (taskId: string) => Promise<void>;
  onArchive: (taskId: string) => Promise<void>;
}

function AgendaTaskCard({ task, date, variant, onOpen, onSchedule, onUnschedule, onArchive }: AgendaTaskCardProps) {
  const [draftDueAt, setDraftDueAt] = useState(formatForDateTimeLocal(task.dueAt));

  useEffect(() => {
    setDraftDueAt(formatForDateTimeLocal(task.dueAt));
  }, [task.dueAt]);

  return (
    <article className="rounded-3xl border border-ink/10 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button className="text-left" onClick={() => onOpen(task.id)} type="button">
            <h4 className="text-lg font-semibold">{task.title}</h4>
          </button>
          <p className="mt-1 text-sm text-ink/70">
            {variant === "inbox"
              ? `Est. ${task.estimatedMinutes ?? 0} min · Priority ${task.priority}`
              : `Due ${new Date(task.dueAt!).toLocaleString()} · Status ${task.status.replace("_", " ")}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variant === "inbox" ? (
            <>
              <button
                className="button-secondary"
                onClick={() => onSchedule(task.id, `${date}T17:00:00`)}
                type="button"
              >
                <CalendarDays className="mr-2" size={16} />
                Plan today
              </button>
              <button
                className="button-secondary"
                onClick={() => onSchedule(task.id, tomorrowAtFive(date))}
                type="button"
              >
                Tomorrow
              </button>
            </>
          ) : (
            <button className="button-secondary" onClick={() => onUnschedule(task.id)} type="button">
              <RotateCcw className="mr-2" size={16} />
              Back to inbox
            </button>
          )}
          <button className="button-secondary" onClick={() => onOpen(task.id)} type="button">
            <ArrowRight className="mr-2" size={16} />
            Open
          </button>
          <button className="button-secondary" onClick={() => onArchive(task.id)} type="button">
            <Archive className="mr-2" size={16} />
            Archive
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-ink/50">Due date</span>
          <input
            className="input"
            onChange={(event) => setDraftDueAt(event.target.value)}
            type="datetime-local"
            value={draftDueAt}
          />
        </label>
        <button
          className="button-primary"
          disabled={!draftDueAt}
          onClick={() => onSchedule(task.id, toIsoString(draftDueAt))}
          type="button"
        >
          Save due date
        </button>
      </div>
    </article>
  );
}

export function AgendaPage() {
  const date = todayKey();
  const { tasks, error, loading, loadTasks, selectTask, updateTask, deleteTask } = useFlowForgeStore();

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const inboxTasks = tasks.filter((task) => !task.dueAt && task.status !== "archived" && task.status !== "done");
  const plannedTasks = tasks.filter((task) => task.dueAt && task.status !== "archived");

  return (
    <div className="space-y-6">
      <section className="card bg-ink text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-leaf">Agenda</p>
        <h2 className="mt-2 text-3xl font-semibold">Triage first, then commit the day.</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/80">
          Quick capture lands in Inbox. Move only the meaningful work onto today&apos;s agenda.
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

      {loading && (
        <div className="card flex items-center justify-center py-8 text-ink/60">
          <p>Loading agenda...</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card">
          <div className="flex items-center gap-3">
            <Inbox size={20} />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Inbox</p>
              <h3 className="mt-1 text-2xl font-semibold">{inboxTasks.length} items waiting for triage</h3>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {inboxTasks.map((task) => (
              <AgendaTaskCard
                key={task.id}
                date={date}
                onArchive={(taskId) => deleteTask(taskId, date)}
                onOpen={(taskId) => selectTask(taskId)}
                onSchedule={(taskId, dueAt) => updateTask(taskId, { dueAt }, date)}
                onUnschedule={async () => undefined}
                task={task}
                variant="inbox"
              />
            ))}
            {!inboxTasks.length && <div className="text-sm text-ink/60">Inbox is clear.</div>}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-moss">Planned</p>
              <h3 className="mt-1 text-2xl font-semibold">{plannedTasks.length} scheduled tasks</h3>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {plannedTasks.map((task) => (
              <AgendaTaskCard
                key={task.id}
                date={date}
                onArchive={(taskId) => deleteTask(taskId, date)}
                onOpen={(taskId) => selectTask(taskId)}
                onSchedule={(taskId, dueAt) => updateTask(taskId, { dueAt }, date)}
                onUnschedule={(taskId) => updateTask(taskId, { dueAt: "" }, date)}
                task={task}
                variant="planned"
              />
            ))}
            {!plannedTasks.length && <div className="text-sm text-ink/60">No scheduled tasks yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
