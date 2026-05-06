import { useEffect } from "react";
import { CheckCircle2, Calendar, Inbox } from "lucide-react";
import { TaskComposer } from "../components/TaskComposer";
import { OutcomeComposer } from "../components/OutcomeComposer";
import { TaskCard } from "../components/TaskCard";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { EmptyState } from "../components/EmptyState";
import { api } from "../lib/tauri";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const date = todayKey();
  const {
    agenda,
    briefing,
    error,
    latestSuggestion,
    activeTask,
    loadDashboard,
    createTask,
    createDailyOutcome,
    setTaskStatus,
    markStuck,
    selectTask,
    updateTask,
    deleteTask,
    createMicroTask,
    completeMicroTask
  } = useFlowForgeStore();

  useEffect(() => {
    void loadDashboard(date);
  }, [date, loadDashboard]);

  return (
    <div className="space-y-6">
      <section className="card bg-ink text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-leaf">Today</p>
        <h2 className="mt-2 text-3xl font-semibold">{briefing?.headline ?? "Small steps compound."}</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/80">
          {briefing?.focusPrompt ?? "Pick one meaningful outcome, then reduce the starting friction."}
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[360px_1fr_420px]">
        <div className="space-y-6">
          <OutcomeComposer date={date} onCreate={createDailyOutcome} />
          <TaskComposer
            onCreate={(input) =>
              createTask(
                {
                  title: input.title,
                  description: input.description,
                  priority: input.priority,
                  dueAt: input.dueAt,
                  estimatedMinutes: input.estimatedMinutes
                },
                date
              )
            }
          />
          {latestSuggestion && (
            <div className="card border border-coral/30 bg-coral/10">
              <p className="text-sm uppercase tracking-[0.3em] text-coral">Unstick Me</p>
              <h3 className="mt-2 text-lg font-semibold">{latestSuggestion.prompt}</h3>
              <p className="mt-2 text-sm text-ink/80">{latestSuggestion.nextStep}</p>
            </div>
          )}
          {error && <div className="card border border-red-200 text-sm text-red-700">{error}</div>}
        </div>
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-moss">Daily outcomes</p>
                <h3 className="mt-2 text-2xl font-semibold">North star for today</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {agenda?.outcomes.map((outcome) => (
                <li key={outcome.id} className="rounded-2xl bg-leaf/20 px-4 py-3 text-sm">
                  {outcome.title}
                </li>
              ))}
              {!agenda?.outcomes.length && (
                <li>
                  <EmptyState
                    icon={CheckCircle2}
                    title="No daily outcomes yet"
                    description="Define 1-3 meaningful outcomes to guide your day's focus."
                    variant="outcomes"
                  />
                </li>
              )}
            </ul>
          </section>

          <section className="space-y-4">
            {(agenda?.tasks ?? []).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={(selectedTask) => selectTask(selectedTask.id)}
                onStart={async (selectedTask) => {
                  await api.startFocusSession(selectedTask.id, selectedTask.estimatedMinutes ?? 25);
                  await setTaskStatus(selectedTask.id, "in_progress", date);
                }}
                onMarkDone={(selectedTask) => setTaskStatus(selectedTask.id, "done", date)}
                onStuck={async (selectedTask, reason) => {
                  await markStuck(selectedTask.id, reason);
                  await setTaskStatus(selectedTask.id, "stuck", date);
                }}
              />
            ))}
            {!agenda?.tasks.length && (
              <EmptyState
                icon={Inbox}
                title="No tasks for today"
                description="Use the quick capture form to add tasks to your inbox."
                variant="tasks"
              />
            )}
          </section>
        </div>
        <TaskDetailPanel
          task={activeTask}
          onClose={() => {
            void selectTask(null);
          }}
          onSave={(patch) => updateTask(activeTask!.id, patch, date)}
          onDelete={() => deleteTask(activeTask!.id, date)}
          onAddMicroTask={(input) => createMicroTask(activeTask!.id, input)}
          onCompleteMicroTask={(microTaskId) => completeMicroTask(activeTask!.id, microTaskId)}
        />
      </div>
    </div>
  );
}
