import { useForm } from "react-hook-form";

interface OutcomeComposerProps {
  date: string;
  onCreate: (input: { localDate: string; title: string; successCriteria?: string }) => Promise<void>;
}

interface OutcomeValues {
  title: string;
  successCriteria: string;
}

export function OutcomeComposer({ date, onCreate }: OutcomeComposerProps) {
  const { register, handleSubmit, reset } = useForm<OutcomeValues>();

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await onCreate({
          localDate: date,
          title: values.title,
          successCriteria: values.successCriteria || undefined
        });
        reset();
      })}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Daily outcomes</p>
        <h2 className="mt-2 text-2xl font-semibold">What would make today feel like a win?</h2>
      </div>
      <input className="input" placeholder="Outcome title" {...register("title", { required: true })} />
      <textarea className="input min-h-24" placeholder="Success criteria" {...register("successCriteria")} />
      <button className="button-primary" type="submit">
        Save outcome
      </button>
    </form>
  );
}
