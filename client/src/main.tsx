import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Disable hover interactions during page load to prevent flickering
// Enable them after 10 seconds
setTimeout(() => {
  document.documentElement.classList.add('page-ready');
  console.log('✅ Page is ready - hover effects enabled');
}, 10000);
