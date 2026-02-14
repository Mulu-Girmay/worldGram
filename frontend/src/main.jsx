import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import { store } from "./Redux/userRedux/store";
import { checkAuth } from "./Redux/userRedux/authThunk";
import { selectAuthInitialized } from "./Redux/userRedux/authSelector";
import { ToastProvider } from "./components/ToastProvider";

function Bootstrap() {
  const dispatch = useDispatch();
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (!initialized) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
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
