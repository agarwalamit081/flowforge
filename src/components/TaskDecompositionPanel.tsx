import { useState } from "react";
import { api } from "../lib/tauri";
import type { TaskDecompositionResult, MicroTaskSuggestion } from "../types/domain";

interface TaskDecompositionPanelProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string | null;
  estimatedMinutes?: number | null;
  onAccept: (microTasks: MicroTaskSuggestion[]) => void;
  onCancel: () => void;
}

export function TaskDecompositionPanel({
  taskId,
  taskTitle,
  taskDescription,
  estimatedMinutes,
  onAccept,
  onCancel,
}: TaskDecompositionPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<TaskDecompositionResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTasks, setEditedTasks] = useState<MicroTaskSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDecompose = async () => {
    setStatus("loading");
    setError(null);
    try {
      const decomposition = await api.decomposeTask({ taskId });
      setResult(decomposition);
      setEditedTasks(decomposition.microTasks);
      setSelectedIds(new Set(decomposition.microTasks.map((_, i) => i)));
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decompose task");
      setStatus("error");
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(editedTasks.map((_, i) => i)));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleEditStart = (id: number) => {
    setEditingId(id);
  };

  const handleEditSave = (id: number, field: keyof MicroTaskSuggestion, value: string | number) => {
    const updated = [...editedTasks];
    updated[id] = { ...updated[id], [field]: value };
    setEditedTasks(updated);
  };

  const handleEditEnd = () => {
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    const updated = editedTasks.filter((_, i) => i !== id);
    setEditedTasks(updated);
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    // Shift indices down
    const shiftedSelected = new Set<number>();
    for (const s of newSelected) {
      if (s > id) {
        shiftedSelected.add(s - 1);
      } else {
        shiftedSelected.add(s);
      }
    }
    setSelectedIds(shiftedSelected);
  };

  const handleMoveUp = (id: number) => {
    if (id === 0) return;
    const updated = [...editedTasks];
    [updated[id - 1], updated[id]] = [updated[id], updated[id - 1]];
    setEditedTasks(updated);
    // Update selection indices
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id - 1)) newSelected.add(id);
    else newSelected.delete(id);
    if (newSelected.has(id)) newSelected.add(id - 1);
    else newSelected.delete(id - 1);
    setSelectedIds(newSelected);
  };

  const handleMoveDown = (id: number) => {
    if (id === editedTasks.length - 1) return;
    const updated = [...editedTasks];
    [updated[id], updated[id + 1]] = [updated[id + 1], updated[id]];
    setEditedTasks(updated);
    // Update selection indices
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.add(id + 1);
    else newSelected.delete(id + 1);
    if (newSelected.has(id + 1)) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleAcceptSelected = () => {
    const selectedTasks = editedTasks.filter((_, i) => selectedIds.has(i));
    onAccept(selectedTasks);
  };

  const handleAcceptAll = () => {
    onAccept(editedTasks);
  };

  if (status === "idle") {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-xl font-semibold">AI Task Decomposition</h3>
          <p className="mt-2 text-sm text-ink-light">
            Break down "{taskTitle}" into actionable micro-tasks with AI assistance.
          </p>
        </div>
        <button
          className="button-primary w-full"
          onClick={handleDecompose}
        >
          Break Down with AI
        </button>
        <button className="button-secondary w-full" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-moss border-t-transparent" />
          <p className="text-ink-light">Analyzing task and generating micro-tasks...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-coral">Decomposition Failed</h3>
          <p className="mt-2 text-sm text-ink-light">{error}</p>
        </div>
        <div className="flex gap-2">
          <button className="button-secondary" onClick={handleDecompose}>
            Try Again
          </button>
          <button className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === "success" && result) {
    const isEditing = editingId !== null;
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-xl font-semibold">AI-Generated Micro-Tasks</h3>
          <p className="mt-2 text-sm text-ink-light">
            {result.startHereHint && (
              <>
                <span className="font-medium text-moss">Start here:</span> {result.startHereHint}
              </>
            )}
          </p>
          {result.goodEnoughDefinition && (
            <p className="mt-1 text-sm text-ink-light">
              <span className="font-medium">Good enough looks like:</span> {result.goodEnoughDefinition}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Micro-Tasks ({editedTasks.length})</p>
            <div className="flex gap-2">
              <button className="text-xs text-moss hover:underline" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="text-xs text-ink-light hover:underline" onClick={handleSelectNone}>
                Select None
              </button>
            </div>
          </div>

          {editedTasks.length === 0 ? (
            <p className="text-center text-ink-light">No micro-tasks generated. Try again or create tasks manually.</p>
          ) : (
            <div className="space-y-2">
              {editedTasks.map((task, i) => (
                <div
                  key={i}
                  className={`relative rounded-lg border p-3 ${
                    selectedIds.has(i)
                      ? "border-leaf bg-leaf/5"
                      : "border-ink/10 bg-white"
                  } ${i === 0 ? "ring-2 ring-moss/20" : ""}`}
                >
                  {i === 0 && (
                    <span className="absolute -top-2 left-3 rounded bg-moss px-2 py-0.5 text-xs font-medium text-white">
                      Start Here
                    </span>
                  )}

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(i)}
                      onChange={() => handleToggleSelect(i)}
                      className="mt-1"
                      disabled={isEditing}
                    />

                    <div className="flex-1">
                      {editingId === i ? (
                        <input
                          className="input mb-2"
                          defaultValue={task.title}
                          autoFocus
                          onBlur={(e) => handleEditSave(i, "title", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditEnd();
                            if (e.key === "Escape") handleEditEnd();
                          }}
                        />
                      ) : (
                        <h4 className="font-medium">{task.title}</h4>
                      )}

                      {task.description && editingId !== i && (
                        <p className="mt-1 text-sm text-ink-light">{task.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-ink/10 px-2 py-0.5">
                          {task.estimatedMinutes}m
                        </span>
                        <span className={`rounded-full px-2 py-0.5 ${
                          task.frictionLevel === "high"
                            ? "bg-coral/20 text-coral"
                            : task.frictionLevel === "medium"
                            ? "bg-moss/20 text-moss"
                            : "bg-leaf/20 text-leaf"
                        }`}>
                          {task.frictionLevel} friction
                        </span>
                      </div>

                      {task.successCriteria && (
                        <p className="mt-2 text-xs text-ink-light">
                          ✓ {task.successCriteria}
                        </p>
                      )}
                    </div>

                    {editingId !== i && (
                      <div className="flex flex-col gap-1">
                        <button
                          className="text-xs text-ink-light hover:text-moss"
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="text-xs text-ink-light hover:text-moss"
                          onClick={() => handleMoveDown(i)}
                          disabled={i === editedTasks.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          className="text-xs text-ink-light hover:text-moss"
                          onClick={() => handleEditStart(i)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-ink-light hover:text-coral"
                          onClick={() => handleDelete(i)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="button-primary flex-1"
            onClick={handleAcceptAll}
            disabled={editedTasks.length === 0}
          >
            Accept All ({editedTasks.length})
          </button>
          <button
            className="button-secondary flex-1"
            onClick={handleAcceptSelected}
            disabled={selectedIds.size === 0}
          >
            Accept Selected ({selectedIds.size})
          </button>
          <button
            className="button-secondary text-coral hover:bg-coral/10"
            onClick={onCancel}
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
