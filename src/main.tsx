import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyTheme, DEFAULT_THEME } from "./lib/theme";
import { bootstrapPersistence } from "./lib/store/hydrate";

applyTheme(DEFAULT_THEME);
void bootstrapPersistence();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
