import { useState } from "react";
import { Play, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import type { Task } from "../types/domain";

const priorityBorders: Record<Task["priority"], string> = {
  1: "border-l-coral",
  2: "border-l-orange-400",
  3: "border-l-moss",
  4: "border-l-sky-400",
  5: "border-l-slate-300"
};

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => Promise<void> | void;
  onStart: (task: Task) => Promise<void>;
  onMarkDone: (task: Task) => Promise<void>;
  onStuck: (task: Task, reason: string) => Promise<void>;
}

export function TaskCard({ task, onOpen, onStart, onMarkDone, onStuck }: TaskCardProps) {
  const [showStuckChooser, setShowStuckChooser] = useState(false);
  const [stuckReason, setStuckReason] = useState("activation_friction");

  return (
    <article className={`card border-l-4 ${priorityBorders[task.priority]}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button className="text-left" onClick={() => onOpen(task)} type="button">
            <h3 className="text-lg font-semibold">{task.title}</h3>
          </button>
          <p className="mt-1 text-sm text-ink/70">
            Status: {task.status.replace("_", " ")} · Est. {task.estimatedMinutes ?? 0} min
          </p>
          {task.description && <p className="mt-3 text-sm text-ink/80">{task.description}</p>}
          {task.goodEnoughDefinition && (
            <p className="mt-3 rounded-2xl bg-leaf/30 px-3 py-2 text-sm text-ink/80">
              Good enough: {task.goodEnoughDefinition}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="button-secondary" onClick={() => onOpen(task)} type="button">
            <ArrowRight className="mr-2" size={16} />
            Details
          </button>
          <button className="button-secondary" onClick={() => onStart(task)} type="button">
            <Play className="mr-2" size={16} />
            Start
          </button>
          <button className="button-secondary" onClick={() => setShowStuckChooser((value) => !value)} type="button">
            <Sparkles className="mr-2" size={16} />
            Stuck
          </button>
          <button className="button-primary" onClick={() => onMarkDone(task)} type="button">
            <CheckCircle2 className="mr-2" size={16} />
            Done
          </button>
        </div>
      </div>
      {showStuckChooser && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 px-3 py-3">
          <select className="input max-w-xs" onChange={(event) => setStuckReason(event.target.value)} value={stuckReason}>
            <option value="activation_friction">Activation friction</option>
            <option value="unclear_scope">Unclear scope</option>
            <option value="too_big">Too big</option>
            <option value="boring">Boring</option>
            <option value="anxious">Anxious</option>
            <option value="perfectionism">Perfectionism</option>
            <option value="waiting">Waiting</option>
            <option value="tired">Tired</option>
          </select>
          <button
            className="button-primary"
            onClick={async () => {
              await onStuck(task, stuckReason);
              setShowStuckChooser(false);
            }}
            type="button"
          >
            Save reason
          </button>
        </div>
      )}
      {task.microTasks.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-ink/80">
          {task.microTasks.map((microTask) => (
            <li key={microTask.id} className="rounded-2xl bg-white/70 px-3 py-2">
              {microTask.title}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
