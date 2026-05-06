import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "tasks" | "outcomes" | "calendar" | "projects";
}

export function EmptyState({ icon: Icon, title, description, action, variant = "default" }: EmptyStateProps) {
  const colors = {
    default: "bg-leaf/10 text-leaf",
    tasks: "bg-moss/10 text-moss",
    outcomes: "bg-sky-400/10 text-sky-600",
    calendar: "bg-purple-400/10 text-purple-600",
    projects: "bg-coral/10 text-coral"
  };

  return (
    <div className="card text-center">
      <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${colors[variant]}`}>
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ink/70">{description}</p>
      {action && (
        <button className="button-secondary mx-auto mt-4" onClick={action.onClick} type="button">
          {action.label}
        </button>
      )}
    </div>
  );
}
