import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";

// Suppress unhandled rejections from assistant-ui's __internal_load()
// which calls history.load() without a catch handler (known upstream issue)
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason === undefined || e.reason === null) e.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
