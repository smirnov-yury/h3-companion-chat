import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPWA } from "./pwa/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Initialize PWA service worker (no-op in iframes / preview hosts)
initPWA();
