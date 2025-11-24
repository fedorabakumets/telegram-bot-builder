import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupHoverDebug } from "./lib/hover-debug";

// Активируем дебаг логирование при наведении
if (import.meta.env.DEV) {
  setupHoverDebug();
}

createRoot(document.getElementById("root")!).render(<App />);
