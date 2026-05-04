import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import { store } from "./Redux/userRedux/store";
import { checkAuth } from "./Redux/userRedux/authThunk";
import { selectAuthInitialized } from "./Redux/userRedux/authSelector";
import { ToastProvider } from "./components/ToastProvider";
import LoadingStream from "./components/LoadingStream";

function Bootstrap() {
  const dispatch = useDispatch();
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (!initialized) {
    return (
      <ToastProvider>
        <div className="min-h-screen grid place-items-center px-4">
          <LoadingStream
            label="Initializing your account"
            lines={4}
            className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-white/75 p-4 shadow-[0_10px_24px_rgba(74,127,74,0.12)]"
          />
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <Bootstrap />
    </Provider>
  </StrictMode>,
);
