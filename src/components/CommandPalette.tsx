import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, LayoutDashboard, Inbox, FolderKanban, Sunrise, Radar, Settings, Plus, Sparkles, CheckCircle2, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "navigation" | "actions" | "tasks";
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    tasks,
    loadDashboard
  } = useFlowForgeStore();

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const commands = useMemo<Command[]>(() => [
    // Navigation commands
    {
      id: "nav-today",
      label: "Go to Today",
      description: "Navigate to the Today dashboard",
      icon: LayoutDashboard,
      category: "navigation",
      action: () => navigate("/"),
      keywords: ["dashboard", "home", "today"]
    },
    {
      id: "nav-agenda",
      label: "Go to Agenda",
      description: "Navigate to the Agenda inbox",
      icon: Inbox,
      category: "navigation",
      action: () => navigate("/agenda"),
      keywords: ["inbox", "triage", "schedule"]
    },
    {
      id: "nav-context",
      label: "Go to Context",
      description: "Navigate to the Context page",
      icon: Radar,
      category: "navigation",
      action: () => navigate("/context"),
      keywords: ["calendar", "focus", "privacy"]
    },
    {
      id: "nav-projects",
      label: "Go to Projects",
      description: "Navigate to the Projects page",
      icon: FolderKanban,
      category: "navigation",
      action: () => navigate("/projects"),
      keywords: ["project", "workspace"]
    },
    {
      id: "nav-briefing",
      label: "Go to Briefing",
      description: "Navigate to the Morning Briefing page",
      icon: Sunrise,
      category: "navigation",
      action: () => navigate("/briefing"),
      keywords: ["morning", "briefing", "ai"]
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      description: "Navigate to the Settings page",
      icon: Settings,
      category: "navigation",
      action: () => navigate("/settings"),
      keywords: ["preferences", "config"]
    },
    // Action commands
    {
      id: "action-run-briefing",
      label: "Run Morning Briefing",
      description: "Generate a new AI-powered morning briefing",
      icon: Sparkles,
      category: "actions",
      action: async () => {
        await loadDashboard(todayKey);
        navigate("/briefing");
      },
      keywords: ["briefing", "ai", "generate", "morning"]
    },
    {
      id: "action-new-task",
      label: "Create New Task",
      description: "Open the task composer to create a new task",
      icon: Plus,
      category: "actions",
      action: () => {
        navigate("/");
        setTimeout(() => {
          const taskInput = document.querySelector("input[placeholder*='Quick capture']") as HTMLInputElement;
          taskInput?.focus();
        }, 100);
      },
      keywords: ["new", "create", "add", "task", "capture"]
    }
  ], [navigate, loadDashboard, todayKey]);

  // Add task commands (top 5 pending tasks)
  const taskCommands = useMemo<Command[]>(() => {
    return tasks
      .filter(task => task.status !== "done" && task.status !== "archived")
      .slice(0, 5)
      .map(task => ({
        id: `task-${task.id}`,
        label: task.title,
        description: `Priority ${task.priority} · ${task.estimatedMinutes ?? 0} min · ${task.status.replace("_", " ")}`,
        icon: CheckCircle2,
        category: "tasks" as const,
        action: () => {
          navigate("/");
          setTimeout(() => {
            // This would trigger the task detail panel to open
            // For now, just navigate to dashboard
          }, 100);
        },
        keywords: [task.title, task.status]
      }));
  }, [tasks, navigate]);

  const allCommands = useMemo(() => [...commands, ...taskCommands], [commands, taskCommands]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands;
    }
    const lowerQuery = query.toLowerCase();
    return allCommands.filter(cmd => {
      const matchesLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchesDesc = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchesKeywords = cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
      return matchesLabel || matchesDesc || matchesKeywords;
    });
  }, [allCommands, query]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if we're in an input field
    const target = event.target as HTMLElement;
    const isInInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      setIsOpen(prev => !prev);
      return;
    }

    if (!isOpen) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case "Enter":
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
          setQuery("");
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const categoryOrder: Record<string, number> = {
    navigation: 0,
    actions: 1,
    tasks: 2
  };

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation",
    actions: "Actions",
    tasks: "Recent Tasks"
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
      onClick={() => {
        setIsOpen(false);
        setQuery("");
      }}
    >
      <div
        className="card w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <Search className="text-ink/50" size={20} />
          <input
            autoFocus
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-ink/40"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
              }
            }}
          />
          <div className="flex items-center gap-1 text-xs text-ink/50">
            <kbd className="rounded border border-ink/20 px-1.5 py-0.5">↑↓</kbd>
            <span>to navigate</span>
          </div>
        </div>

        {/* Commands list */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-ink/50">
              <Search className="mx-auto mb-3 size-12 opacity-30" />
              <p>No commands found</p>
              <p className="mt-1 text-sm">Try a different search term</p>
            </div>
          ) : (
            Object.entries(groupedCommands)
              .sort(([a], [b]) => categoryOrder[a] - categoryOrder[b])
              .map(([category, cmds]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
                    {categoryLabels[category] || category}
                  </div>
                  {cmds.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          isSelected ? "bg-leaf/20" : "hover:bg-ink/5"
                        }`}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                          setQuery("");
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        type="button"
                      >
                        <Icon className={`mt-0.5 size-5 flex-shrink-0 ${isSelected ? "text-leaf" : "text-ink/50"}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${isSelected ? "text-leaf" : ""}`}>{cmd.label}</div>
                          {cmd.description && (
                            <div className={`truncate text-sm ${isSelected ? "text-leaf/80" : "text-ink/60"}`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs text-leaf/60">
                            <kbd className="rounded border border-leaf/30 px-1.5 py-0.5">↵</kbd>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink/10 px-4 py-2 text-xs text-ink/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-ink/20 px-1.5 py-0.5">↑↓</kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-ink/20 px-1.5 py-0.5">↵</kbd>
              <span>select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-ink/20 px-1.5 py-0.5">esc</kbd>
              <span>close</span>
            </div>
          </div>
          <div>{filteredCommands.length} command{filteredCommands.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
    </div>
  );
}
