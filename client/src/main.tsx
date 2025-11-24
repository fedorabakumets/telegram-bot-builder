import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🚀 Disable ALL mouse events during initial page load to prevent hover-triggered re-renders
const html = document.documentElement;
html.classList.add("loading");

// Mark global window object to signal app is still loading
(window as any).appIsLoading = true;

// Initialize theme BEFORE React mounts to prevent flicker from ThemeProvider
const initializeTheme = () => {
  const storageKey = "telegram-bot-builder-theme";
  const theme = localStorage.getItem(storageKey) || "system";
  
  html.classList.remove("light", "dark");
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    html.classList.add(systemTheme);
  } else {
    html.classList.add(theme);
  }
};

// Apply theme synchronously before React renders
initializeTheme();

// Gradually remove loading restrictions using requestAnimationFrame for smooth transition
// This prevents the massive animation restart that causes flickering
setTimeout(() => {
  // First, enable mouse events but keep animations blocked for one more frame
  requestAnimationFrame(() => {
    (window as any).appIsLoading = false;
    
    // Then, in the next frame, remove the loading class to enable animations gradually
    requestAnimationFrame(() => {
      html.classList.remove("loading");
      console.log("✅ App ready - interactions enabled");
    });
  });
}, 5000);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

