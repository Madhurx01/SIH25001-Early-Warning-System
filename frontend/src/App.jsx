import { useCallback, useEffect, useState } from "react";

import DashboardLayout from "./components/Layout/DashboardLayout.jsx";
import CommunityReportsPage from "./pages/CommunityReportsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import { getHealth } from "./services/api.js";

const validPages = new Set(["overview", "community", "villages", "surveillance", "outlook"]);

function getPageFromHash() {
  const page = window.location.hash.replace(/^#\/?/, "") || "overview";
  return validPages.has(page) ? page : "overview";
}

function App() {
  const [activePage, setActivePage] = useState(getPageFromHash);
  const [connection, setConnection] = useState("checking");

  useEffect(() => {
    function handleHashChange() { setActivePage(getPageFromHash()); }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (["overview", "community"].includes(activePage)) return undefined;

    const controller = new AbortController();
    setConnection("checking");
    getHealth(controller.signal)
      .then(() => setConnection("connected"))
      .catch((error) => {
        if (error.name !== "AbortError") setConnection("unavailable");
      });

    return () => controller.abort();
  }, [activePage]);

  const handleConnectionChange = useCallback((status) => setConnection(status), []);

  return (
    <DashboardLayout activePage={activePage} connection={connection} onNavigate={setActivePage}>
      {activePage === "overview" ? (
        <DashboardPage onConnectionChange={handleConnectionChange} />
      ) : activePage === "community" ? (
        <CommunityReportsPage onConnectionChange={handleConnectionChange} />
      ) : (
        <PlaceholderPage page={activePage} />
      )}
    </DashboardLayout>
  );
}

export default App;
