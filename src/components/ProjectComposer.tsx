import { useForm } from "react-hook-form";

interface ProjectComposerProps {
  onCreate: (input: { name: string; description?: string; color?: string }) => Promise<void>;
}

interface ProjectValues {
  name: string;
  description: string;
  color: string;
}

export function ProjectComposer({ onCreate }: ProjectComposerProps) {
  const { register, handleSubmit, reset } = useForm<ProjectValues>({
    defaultValues: { color: "#2e5e4e" }
  });

  return (
    <form
      className="card grid gap-4 md:grid-cols-[1fr_1fr_100px_auto]"
      onSubmit={handleSubmit(async (values) => {
        await onCreate(values);
        reset({ color: values.color });
      })}
    >
      <input className="input" placeholder="Project name" {...register("name", { required: true })} />
      <input className="input" placeholder="Description" {...register("description")} />
      <input className="input h-12 p-1" type="color" {...register("color")} />
      <button className="button-primary" type="submit">
        New project
      </button>
    </form>
  );
}
