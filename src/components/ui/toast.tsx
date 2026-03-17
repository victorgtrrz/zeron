"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

type ToastVariant = "error" | "success" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-highlight/30 bg-highlight/10 text-highlight",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  error: "text-destructive",
  success: "text-success",
  info: "text-highlight",
  warning: "text-warning",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const Icon = ICONS[toast.variant];

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);

    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  function handleDismiss() {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-300 ${
        VARIANT_STYLES[toast.variant]
      } ${exiting ? "translate-x-full opacity-0" : "animate-slide-in-right"}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${ICON_STYLES[toast.variant]}`} />
      <p className="min-w-0 flex-1 text-sm font-medium text-accent">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-md p-0.5 text-muted transition-colors hover:text-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "error") => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
