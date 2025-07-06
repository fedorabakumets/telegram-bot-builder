import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Performance optimization: preconnect to external resources
const link = document.createElement('link');
link.rel = 'preconnect';
link.href = 'https://cdnjs.cloudflare.com';
document.head.appendChild(link);

const linkDns = document.createElement('link');
linkDns.rel = 'dns-prefetch';
linkDns.href = 'https://cdnjs.cloudflare.com';
document.head.appendChild(linkDns);

createRoot(document.getElementById("root")!).render(<App />);
