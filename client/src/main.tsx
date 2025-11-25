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


// Track all DOM mutations in header and sidebar during loading
const startTime = performance.now();
let mutationCount = 0;

const mutationObserver = new MutationObserver((mutations) => {
  const isLoading = html.classList.contains('loading');
  
  mutations.forEach((mutation) => {
    const target = mutation.target as HTMLElement;
    const isHeader = target.closest('header') !== null;
    const isSidebar = target.tagName === 'ASIDE' || target.closest('aside') !== null;
    
    if (isHeader || isSidebar) {
      mutationCount++;
      const elapsedTime = (performance.now() - startTime).toFixed(0);
      
      if (mutation.type === 'attributes') {
        console.log(`[${elapsedTime}ms] 🎯 DOM MUTATION #${mutationCount} (${isHeader ? 'HEADER' : 'SIDEBAR'}):`, {
          type: 'attributes',
          attr: mutation.attributeName,
          newValue: target.getAttribute(mutation.attributeName!),
          tag: target.tagName
        });
      } else if (mutation.type === 'childList') {
        console.log(`[${elapsedTime}ms] 🎯 DOM MUTATION #${mutationCount} (${isHeader ? 'HEADER' : 'SIDEBAR'}):`, {
          type: 'childList',
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          tag: target.tagName
        });
      }
    }
  });
});

mutationObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class', 'style'],
  childList: true,
  subtree: true,
  attributeOldValue: true
});

// Gradually remove loading restrictions using requestAnimationFrame for smooth transition
// This prevents the massive animation restart that causes flickering
setTimeout(() => {
  console.log(`⏱️ 5 seconds elapsed - Total DOM mutations: ${mutationCount}`);
  mutationObserver.disconnect();
  
  // First, enable mouse events but keep animations blocked for one more frame
  requestAnimationFrame(() => {
    (window as any).appIsLoading = false;
    console.log("🚀 appIsLoading = false");
    
    // Then, in the next frame, remove the loading class to enable animations gradually
    requestAnimationFrame(() => {
      html.classList.remove("loading");
      console.log("✅ App ready - interactions enabled, loading class removed");
    });
  });
}, 5000);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

