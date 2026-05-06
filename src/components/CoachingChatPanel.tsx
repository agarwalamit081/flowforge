import { useState, useRef, useEffect } from "react";
import { api } from "../lib/tauri";
import type { ChatMessage, ChatResponse, SuggestedAction } from "../types/domain";

interface CoachingChatPanelProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

export function CoachingChatPanel({ taskId, taskTitle, onClose }: CoachingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      taskId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSuggestedActions([]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await api.sendChatMessage({
        taskId,
        message: text,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        taskId,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestedActions(response.suggestedActions || []);
    } catch (e) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        taskId,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    handleSendMessage(action.label);
  };

  return (
    <div className="card flex h-[600px] flex-col">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h3 className="text-xl font-semibold">AI Coach</h3>
          <p className="text-sm text-ink-light">
            Task: {taskTitle}
          </p>
        </div>
        <button
          className="text-ink-light hover:text-ink"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-ink-light">I'm your AI productivity coach.</p>
              <p className="mt-2 text-sm text-ink-light">
                Share what's on your mind, and I'll help you find your way forward.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-moss text-white"
                  : "bg-ink/5 text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              <p className={`mt-1 text-xs ${
                msg.role === "user" ? "text-leaf/70" : "text-ink-light"
              }`}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-ink/5 px-4 py-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-ink-light" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-ink-light [animation-delay:0.1s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-ink-light [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-4">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              className="rounded-full bg-leaf/20 px-4 py-2 text-sm font-medium text-moss hover:bg-leaf/30"
              onClick={() => handleSuggestedAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="flex gap-2 border-t border-ink/10 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          className="input flex-1"
          placeholder="What's on your mind?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="button-primary px-6"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
