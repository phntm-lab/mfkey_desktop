import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyTheme, DEFAULT_THEME } from "./lib/theme";

applyTheme(DEFAULT_THEME);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
