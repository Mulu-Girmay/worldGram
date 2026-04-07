import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const removalTimers = useRef(new Map());

  useEffect(
    () => () => {
      removalTimers.current.forEach((timerId) => window.clearTimeout(timerId));
      removalTimers.current.clear();
    },
    [],
  );

  const remove = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast,
      ),
    );

    if (removalTimers.current.has(id)) return;
    const timerId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      window.clearTimeout(removalTimers.current.get(id));
      removalTimers.current.delete(id);
    }, 180);
    removalTimers.current.set(id, timerId);
  }, []);

  const push = useCallback(
    (type, message, timeout = 3500) => {
      if (!message) return;
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev,
        { id, type, message, entering: true, closing: false },
      ]);
      window.requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((toast) =>
            toast.id === id ? { ...toast, entering: false } : toast,
          ),
        );
      });
      if (timeout > 0) {
        window.setTimeout(() => remove(id), timeout);
      }
    },
    [remove],
  );

  const value = useMemo(
    () => ({
      success: (message, timeout) => push("success", message, timeout),
      error: (message, timeout) => push("error", message, timeout),
      info: (message, timeout) => push("info", message, timeout),
      remove,
    }),
    [push, remove],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[200] flex w-[min(90vw,360px)] flex-col gap-2">
        {toasts.map((toast) => {
          const tone =
            toast.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : toast.type === "error"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-slate-300 bg-white text-slate-800";

          return (
            <div
              key={toast.id}
              role="status"
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-sm shadow-lg transition-all duration-200 ease-out ${tone} ${
                toast.entering
                  ? "translate-y-2 scale-95 opacity-0"
                  : toast.closing
                    ? "translate-y-1 scale-95 opacity-0"
                    : "translate-y-0 scale-100 opacity-100 micro-toast-in"
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss notification"
                className="rounded px-1 text-xs opacity-70 transition-all duration-150 hover:-translate-y-0.5 hover:opacity-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                x
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
};
