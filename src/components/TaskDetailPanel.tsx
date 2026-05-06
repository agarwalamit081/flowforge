import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Archive, CheckCircle2, X } from "lucide-react";
import type { Task } from "../types/domain";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onSave: (patch: {
    title?: string;
    description?: string | null;
    priority?: number;
    dueAt?: string | null;
    estimatedMinutes?: number | null;
    goodEnoughDefinition?: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddMicroTask: (input: { title: string; estimatedMinutes?: number | null }) => Promise<void>;
  onCompleteMicroTask: (microTaskId: string) => Promise<void>;
}

interface TaskFormValues {
  title: string;
  description: string;
  priority: number;
  dueAt: string;
  estimatedMinutes: number;
  goodEnoughDefinition: string;
  microTaskTitle: string;
  microTaskMinutes: number;
}

export function TaskDetailPanel({
  task,
  onClose,
  onSave,
  onDelete,
  onAddMicroTask,
  onCompleteMicroTask
}: TaskDetailPanelProps) {
  const {
    register,
    handleSubmit,
    reset
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      priority: 3,
      dueAt: "",
      estimatedMinutes: 25,
      goodEnoughDefinition: ""
    }
  });
  const {
    register: registerMicroTask,
    handleSubmit: handleMicroTaskSubmit,
    reset: resetMicroTask
  } = useForm<{ microTaskTitle: string; microTaskMinutes: number }>({
    defaultValues: {
      microTaskTitle: "",
      microTaskMinutes: 10
    }
  });

  useEffect(() => {
    if (!task) {
      return;
    }
    reset({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
      estimatedMinutes: task.estimatedMinutes ?? 25,
      goodEnoughDefinition: task.goodEnoughDefinition ?? ""
    });
    resetMicroTask({
      microTaskTitle: "",
      microTaskMinutes: 10
    });
  }, [reset, resetMicroTask, task]);

  if (!task) {
    return null;
  }

  return (
    <aside className="card sticky top-6 h-fit space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Task detail</p>
          <h3 className="mt-2 text-2xl font-semibold">{task.title}</h3>
          <p className="mt-2 text-sm text-ink/70">Status: {task.status.replace("_", " ")}</p>
        </div>
        <button className="button-secondary px-3" onClick={onClose} type="button">
          <X size={16} />
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          await onSave({
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : "",
            estimatedMinutes: values.estimatedMinutes,
            goodEnoughDefinition: values.goodEnoughDefinition || null
          });
        })}
      >
        <input className="input" {...register("title", { required: true })} />
        <textarea className="input min-h-24" placeholder="Description" {...register("description")} />
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input" max={5} min={1} type="number" {...register("priority", { valueAsNumber: true })} />
          <input className="input" min={5} step={5} type="number" {...register("estimatedMinutes", { valueAsNumber: true })} />
        </div>
        <input className="input" type="datetime-local" {...register("dueAt")} />
        <textarea className="input min-h-24" placeholder="Good enough definition" {...register("goodEnoughDefinition")} />
        <div className="flex gap-3">
          <button className="button-primary" type="submit">
            Save changes
          </button>
          <button className="button-secondary" onClick={onDelete} type="button">
            <Archive className="mr-2" size={16} />
            Archive task
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Micro-tasks</p>
          <h4 className="mt-2 text-xl font-semibold">Break it down</h4>
        </div>
        <form
          className="grid gap-3 md:grid-cols-[1fr_120px_auto]"
          onSubmit={handleMicroTaskSubmit(async (values) => {
            await onAddMicroTask({
              title: values.microTaskTitle,
              estimatedMinutes: values.microTaskMinutes
            });
            resetMicroTask({
              microTaskTitle: "",
              microTaskMinutes: 10
            });
          })}
        >
          <input className="input" placeholder="Small next step" {...registerMicroTask("microTaskTitle", { required: true })} />
          <input
            className="input"
            min={5}
            step={5}
            type="number"
            {...registerMicroTask("microTaskMinutes", { valueAsNumber: true })}
          />
          <button className="button-secondary" type="submit">
            Add
          </button>
        </form>
        <ul className="space-y-3">
          {task.microTasks.map((microTask) => (
            <li
              key={microTask.id}
              className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{microTask.title}</p>
                <p className="text-xs text-ink/60">{microTask.estimatedMinutes} min</p>
              </div>
              <button
                className="button-secondary"
                disabled={microTask.status === "done"}
                onClick={() => onCompleteMicroTask(microTask.id)}
                type="button"
              >
                <CheckCircle2 className="mr-2" size={16} />
                {microTask.status === "done" ? "Done" : "Complete"}
              </button>
            </li>
          ))}
          {!task.microTasks.length && <li className="text-sm text-ink/60">No micro-tasks yet.</li>}
        </ul>
      </section>
    </aside>
  );
}
