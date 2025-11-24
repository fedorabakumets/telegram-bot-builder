import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Handle clicks even with pointer-events: none on all elements
// This is necessary because pointer-events: none prevents mouse events
document.addEventListener('click', (e: any) => {
  const target = e.target as HTMLElement;
  
  // Find the closest clickable element
  const clickableElement = target.closest('button, input, textarea, select, a, [role="button"], [role="menuitem"]');
  
  if (clickableElement && typeof (clickableElement as any).click === 'function') {
    // Re-trigger click on the element - this works even with pointer-events: none
    (clickableElement as any).click();
  }
}, { capture: true, passive: false });

