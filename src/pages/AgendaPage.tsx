import { useEffect } from "react";
import { ArrowRight, CalendarDays, Inbox, Archive } from "lucide-react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AgendaPage() {
  const date = todayKey();
  const { tasks, loadTasks, selectTask, updateTask, deleteTask } = useFlowForgeStore();

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
              <article key={task.id} className="rounded-3xl border border-ink/10 bg-white px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <button className="text-left" onClick={() => selectTask(task.id)} type="button">
                      <h4 className="text-lg font-semibold">{task.title}</h4>
                    </button>
                    <p className="mt-1 text-sm text-ink/70">
                      Est. {task.estimatedMinutes ?? 0} min · Priority {task.priority}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="button-secondary"
                      onClick={() => updateTask(task.id, { dueAt: `${date}T17:00:00` }, date)}
                      type="button"
                    >
                      <CalendarDays className="mr-2" size={16} />
                      Plan today
                    </button>
                    <button className="button-secondary" onClick={() => selectTask(task.id)} type="button">
                      <ArrowRight className="mr-2" size={16} />
                      Open
                    </button>
                    <button className="button-secondary" onClick={() => deleteTask(task.id, date)} type="button">
                      <Archive className="mr-2" size={16} />
                      Archive
                    </button>
                  </div>
                </div>
              </article>
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
              <article key={task.id} className="rounded-3xl border border-ink/10 bg-white px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <button className="text-left" onClick={() => selectTask(task.id)} type="button">
                      <h4 className="text-lg font-semibold">{task.title}</h4>
                    </button>
                    <p className="mt-1 text-sm text-ink/70">
                      Due {new Date(task.dueAt!).toLocaleString()} · Status {task.status.replace("_", " ")}
                    </p>
                  </div>
                  <button className="button-secondary" onClick={() => selectTask(task.id)} type="button">
                    <ArrowRight className="mr-2" size={16} />
                    Review
                  </button>
                </div>
              </article>
            ))}
            {!plannedTasks.length && <div className="text-sm text-ink/60">No scheduled tasks yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
