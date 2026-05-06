import { useState } from "react";
import { api } from "../lib/tauri";
import type { GoalClarificationResult } from "../types/domain";

interface GoalClarifierPanelProps {
  taskId: string;
  taskTitle: string;
  onAccept: (result: GoalClarificationResult) => void;
  onCancel: () => void;
}

export function GoalClarifierPanel({
  taskId,
  taskTitle,
  onAccept,
  onCancel,
}: GoalClarifierPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<GoalClarificationResult | null>(null);
  const [editedResult, setEditedResult] = useState<GoalClarificationResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClarify = async () => {
    setStatus("loading");
    setError(null);
    try {
      const clarification = await api.clarifyGoal({ taskId });
      setResult(clarification);
      setEditedResult(clarification);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clarify goal");
      setStatus("error");
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedResult) {
      setResult(editedResult);
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedResult(result);
    setEditing(false);
  };

  const handleFieldChange = (field: keyof GoalClarificationResult, value: string | number) => {
    if (editedResult) {
      setEditedResult({ ...editedResult, [field]: value });
    }
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result);
    }
  };

  if (status === "idle") {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-xl font-semibold">AI Goal Clarification</h3>
          <p className="mt-2 text-sm text-ink-light">
            Convert "{taskTitle}" into a clear, actionable SMART goal.
          </p>
        </div>
        <button
          className="button-primary w-full"
          onClick={handleClarify}
        >
          Clarify with AI
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
          <p className="text-ink-light">Analyzing goal and generating SMART framework...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-coral">Clarification Failed</h3>
          <p className="mt-2 text-sm text-ink-light">{error}</p>
        </div>
        <div className="flex gap-2">
          <button className="button-secondary" onClick={handleClarify}>
            Try Again
          </button>
          <button className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === "success" && result && editedResult) {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="text-xl font-semibold">SMART Goal</h3>
          {!editing && (
            <p className="mt-2 text-sm text-ink-light">
              Your goal has been converted into a Specific, Measurable, Achievable, Relevant, and Time-bound commitment.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* SMART Goal Statement */}
          <div className="rounded-lg bg-leaf/10 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-moss">SMART Goal Statement</p>
            {editing ? (
              <textarea
                className="input min-h-24"
                value={editedResult.smartGoal}
                onChange={(e) => handleFieldChange("smartGoal", e.target.value)}
              />
            ) : (
              <p className="text-lg font-medium">{result.smartGoal}</p>
            )}
          </div>

          {/* Done Looks Like */}
          <div>
            <p className="mb-2 text-sm font-medium">What "done" looks like:</p>
            {editing ? (
              <textarea
                className="input min-h-20"
                value={editedResult.doneLooksLike}
                onChange={(e) => handleFieldChange("doneLooksLike", e.target.value)}
              />
            ) : (
              <p className="rounded-lg bg-white p-3 text-sm">{result.doneLooksLike}</p>
            )}
          </div>

          {/* Minimum Viable Outcome */}
          <div>
            <p className="mb-2 text-sm font-medium">Minimum viable outcome:</p>
            {editing ? (
              <textarea
                className="input min-h-16"
                value={editedResult.minimumViableOutcome}
                onChange={(e) => handleFieldChange("minimumViableOutcome", e.target.value)}
              />
            ) : (
              <p className="rounded-lg bg-white p-3 text-sm">{result.minimumViableOutcome}</p>
            )}
          </div>

          {/* First Measurable Step */}
          <div>
            <p className="mb-2 text-sm font-medium">First measurable step:</p>
            {editing ? (
              <input
                className="input"
                value={editedResult.firstMeasurableStep}
                onChange={(e) => handleFieldChange("firstMeasurableStep", e.target.value)}
              />
            ) : (
              <p className="rounded-lg bg-moss/10 p-3 text-sm font-medium">{result.firstMeasurableStep}</p>
            )}
          </div>

          {/* Suggested Timebox */}
          <div>
            <p className="mb-2 text-sm font-medium">Suggested timebox:</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  className="input w-24"
                  type="number"
                  min={5}
                  step={5}
                  value={editedResult.suggestedTimeboxMinutes}
                  onChange={(e) => handleFieldChange("suggestedTimeboxMinutes", parseInt(e.target.value) || 25)}
                />
                <span className="text-sm text-ink-light">minutes</span>
              </div>
            ) : (
              <p className="text-lg font-semibold">{result.suggestedTimeboxMinutes} minutes</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="button-primary flex-1" onClick={handleSaveEdit}>
                Save Changes
              </button>
              <button className="button-secondary flex-1" onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            </>
          ) : (
            <>
              <button className="button-primary flex-1" onClick={handleAccept}>
                Accept & Apply
              </button>
              <button className="button-secondary flex-1" onClick={handleEdit}>
                Edit
              </button>
              <button className="button-secondary text-coral hover:bg-coral/10" onClick={onCancel}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
