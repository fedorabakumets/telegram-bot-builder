import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Block hover-related mouse events to prevent React re-renders
// These are: mouseenter, mouseover, mouseleave, mouseout
// But allow click, mousedown, mouseup for actual interactions
const hooverEvents = ['mouseenter', 'mouseover', 'mouseleave', 'mouseout'];

hooverEvents.forEach(eventType => {
  document.addEventListener(eventType, (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  }, { capture: true, passive: false });
});

