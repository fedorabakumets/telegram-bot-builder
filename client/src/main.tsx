import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Enable transitions after React has finished rendering
// This prevents flickering during initial load
setTimeout(() => {
  document.documentElement.classList.add('transitions-enabled');
  console.log('✅ Transitions enabled');
}, 100);
