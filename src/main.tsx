import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { bootstrapPersistence } from "./lib/store/hydrate";

void bootstrapPersistence();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
