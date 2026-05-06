import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Check } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

interface TaskComposerProps {
  onCreate: (input: {
    title: string;
    description?: string | null;
    priority?: number;
    dueAt?: string | null;
    estimatedMinutes?: number;
  }) => Promise<void>;
}

interface TaskComposerValues {
  title: string;
  description: string;
  priority: number;
  dueAt: string;
  estimatedMinutes?: number;
}

export function TaskComposer({ onCreate }: TaskComposerProps) {
  const [advanced, setAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const { register, handleSubmit, reset } = useForm<TaskComposerValues>({
    defaultValues: { title: "", description: "", priority: 3, dueAt: "", estimatedMinutes: 25 }
  });

  return (
    <form
      className="card grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        setIsSubmitting(true);
        try {
          await onCreate({
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
            estimatedMinutes: values.estimatedMinutes
          });
          reset();
          showSuccess("Task added successfully");
        } catch (error) {
          showError(error instanceof Error ? error.message : "Failed to add task");
        } finally {
          setIsSubmitting(false);
        }
      })}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mb-2 text-sm text-ink/60">Quick capture sends new tasks to Inbox for later triage.</p>
        <button className="button-secondary" onClick={() => setAdvanced((value) => !value)} type="button">
          {advanced ? "Hide details" : "Add details"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_140px_auto]">
        <input
          className="input"
          placeholder="Quick capture to inbox"
          {...register("title", { required: true })}
          disabled={isSubmitting}
        />
        <input
          className="input"
          min={5}
          step={5}
          type="number"
          {...register("estimatedMinutes", { valueAsNumber: true })}
          disabled={isSubmitting}
        />
        <button className="button-primary flex items-center justify-center gap-2" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Adding...
            </>
          ) : (
            "Add task"
          )}
        </button>
      </div>
      {advanced && (
        <>
          <textarea className="input min-h-24" placeholder="Description" {...register("description")} disabled={isSubmitting} />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" max={5} min={1} type="number" {...register("priority", { valueAsNumber: true })} disabled={isSubmitting} />
            <input className="input" type="datetime-local" {...register("dueAt")} disabled={isSubmitting} />
          </div>
        </>
      )}
    </form>
  );
}
