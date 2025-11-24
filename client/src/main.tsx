import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupHoverDebug } from "./lib/hover-debug";

// Активируем дебаг логирование при наведении
if (import.meta.env.DEV) {
  setupHoverDebug();
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Enable transitions after React has finished rendering
// This prevents flickering during initial load
setTimeout(() => {
  document.documentElement.classList.add('transitions-enabled');
  console.log('✅ Transitions enabled');
}, 100);
