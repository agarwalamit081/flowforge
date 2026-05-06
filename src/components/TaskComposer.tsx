import { useForm } from "react-hook-form";

interface TaskComposerProps {
  onCreate: (input: { title: string; estimatedMinutes?: number }) => Promise<void>;
}

interface TaskComposerValues {
  title: string;
  estimatedMinutes?: number;
}

export function TaskComposer({ onCreate }: TaskComposerProps) {
  const { register, handleSubmit, reset } = useForm<TaskComposerValues>({
    defaultValues: { title: "", estimatedMinutes: 25 }
  });

  return (
    <form
      className="card grid gap-4 md:grid-cols-[1fr_140px_auto]"
      onSubmit={handleSubmit(async (values) => {
        await onCreate(values);
        reset();
      })}
    >
      <div className="md:col-span-3">
        <p className="mb-2 text-sm text-ink/60">Quick capture sends new tasks to Inbox for later triage.</p>
      </div>
      <input className="input" placeholder="Quick capture to inbox" {...register("title", { required: true })} />
      <input className="input" min={5} step={5} type="number" {...register("estimatedMinutes", { valueAsNumber: true })} />
      <button className="button-primary" type="submit">
        Add task
      </button>
    </form>
  );
}
