import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Temporarily enable pointer events for clicks
// This works by allowing click events while keeping pointer-events: none
document.addEventListener('pointerdown', (e: PointerEvent) => {
  const target = e.target as HTMLElement;
  const clickableElement = target.closest('button, input, textarea, select, a, [role="button"], [role="menuitem"]');
  
  if (clickableElement) {
    // Temporarily enable pointer events for this element
    const originalPointerEvents = clickableElement.style.pointerEvents;
    clickableElement.style.pointerEvents = 'auto';
    
    // Schedule restoration after event
    setTimeout(() => {
      clickableElement.style.pointerEvents = originalPointerEvents || '';
    }, 0);
  }
}, true);

