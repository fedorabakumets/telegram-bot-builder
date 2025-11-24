import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🚀 Disable ALL mouse events during initial page load to prevent hover-triggered re-renders
const html = document.documentElement;
html.classList.add("loading");

// Mark global window object to signal app is still loading
(window as any).appIsLoading = true;

// Remove the "loading" class after 25 seconds to allow components to fully stabilize
setTimeout(() => {
  html.classList.remove("loading");
  (window as any).appIsLoading = false;
  console.log("✅ Loading complete - mouse events re-enabled");
}, 25000);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

