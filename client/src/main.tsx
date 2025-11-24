import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Global click handler to make buttons/links work despite pointer-events: none
// This prevents hover-triggered re-renders while keeping click functionality
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const clickableElements = [
    'BUTTON',
    'A',
    'INPUT',
    'SELECT',
    'TEXTAREA'
  ];
  
  // Check if clicked element or any parent is clickable
  let element: HTMLElement | null = target;
  while (element) {
    if (clickableElements.includes(element.tagName)) {
      // Dispatch click event to the element
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(clickEvent);
      break;
    }
    element = element.parentElement;
  }
}, true);

