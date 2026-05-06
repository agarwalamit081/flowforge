import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast, type ToastType } from "../contexts/ToastContext";

const toastIcons: Record<ToastType, React.ComponentType<{ className: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-l-leaf bg-leaf/10 text-leaf",
  error: "border-l-coral bg-coral/10 text-coral",
  info: "border-l-sky-400 bg-sky-400/10 text-sky-600",
  warning: "border-l-orange-400 bg-orange-400/10 text-orange-600",
};

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onRemove: (id: string) => void;
}

export function Toast({ id, message, type, onRemove }: ToastProps) {
  const Icon = toastIcons[type];
  const style = toastStyles[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div className={`card flex items-start gap-3 border-l-4 p-4 shadow-lg ${style}`}>
      <Icon className="mt-0.5 size-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        className="text-current/50 hover:text-current transition"
        onClick={() => onRemove(id)}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}
