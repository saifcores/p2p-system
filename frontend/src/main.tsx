import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APP_LOCALE } from "./locale";
import "./index.css";
import App from "./App.tsx";

document.documentElement.lang = APP_LOCALE;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
