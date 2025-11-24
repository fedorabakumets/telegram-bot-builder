import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Enable interactions after 15 seconds to prevent flickering on hover
setTimeout(() => {
  document.documentElement.classList.add('page-loaded');
}, 15000);

