import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import BackendReadinessGate from "./components/BackendReadinessGate.jsx";
import "leaflet/dist/leaflet.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackendReadinessGate><AuthProvider><App /></AuthProvider></BackendReadinessGate>
  </StrictMode>,
);
