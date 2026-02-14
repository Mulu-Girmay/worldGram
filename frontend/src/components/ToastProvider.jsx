import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type, message, timeout = 3500) => {
      if (!message) return;
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, type, message }]);
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
              className={`pointer-events-auto flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-sm shadow-lg ${tone}`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss notification"
                className="rounded px-1 text-xs opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
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
