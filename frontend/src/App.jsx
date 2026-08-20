import { useCallback, useEffect, useState } from "react";

import DashboardLayout from "./components/Layout/DashboardLayout.jsx";
import CitizenReportPage from "./pages/CitizenReportPage.jsx";
import CommunityReportsPage from "./pages/CommunityReportsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import OutlookPage from "./pages/OutlookPage.jsx";
import ReportStatusPage from "./pages/ReportStatusPage.jsx";
import SurveillancePage from "./pages/SurveillancePage.jsx";
import VillageDetailPage from "./pages/VillageDetailPage.jsx";
import VillagesPage from "./pages/VillagesPage.jsx";

function getRoute() { return window.location.hash.replace(/^#\/?/, "").split("?")[0] || "overview"; }

function App() {
  const [route, setRoute] = useState(getRoute);
  const [connection, setConnection] = useState("checking");
  useEffect(() => { const handler = () => setRoute(getRoute()); window.addEventListener("hashchange", handler); return () => window.removeEventListener("hashchange", handler); }, []);
  const onConnectionChange = useCallback((status) => setConnection(status), []);
  if (route === "citizen-report") return <CitizenReportPage/>;
  if (route === "report-status") return <ReportStatusPage/>;
  const [page, villageId] = route.split("/");
  const activePage = ["overview", "community", "villages", "surveillance", "outlook"].includes(page) ? page : "overview";
  let content;
  if (activePage === "overview") content = <DashboardPage onConnectionChange={onConnectionChange}/>;
  else if (activePage === "community") content = <CommunityReportsPage onConnectionChange={onConnectionChange}/>;
  else if (activePage === "villages" && villageId) content = <VillageDetailPage villageId={decodeURIComponent(villageId)} onConnectionChange={onConnectionChange}/>;
  else if (activePage === "villages") content = <VillagesPage onConnectionChange={onConnectionChange}/>;
  else if (activePage === "surveillance") content = <SurveillancePage onConnectionChange={onConnectionChange}/>;
  else content = <OutlookPage onConnectionChange={onConnectionChange}/>;
  return <DashboardLayout activePage={activePage} connection={connection} onNavigate={setRoute}>{content}</DashboardLayout>;
}

export default App;
