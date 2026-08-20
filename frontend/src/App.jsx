import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "./auth/ProtectedRoute.jsx";
import DashboardLayout from "./components/Layout/DashboardLayout.jsx";
import AccessDeniedPage from "./pages/AccessDeniedPage.jsx";
import CitizenReportPage from "./pages/CitizenReportPage.jsx";
import CommunityReportsPage from "./pages/CommunityReportsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import OutlookPage from "./pages/OutlookPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ReportStatusPage from "./pages/ReportStatusPage.jsx";
import StaffPortalPage from "./pages/StaffPortalPage.jsx";
import StaffReportsPage from "./pages/StaffReportsPage.jsx";
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
  if (route === "login") return <LoginPage/>;

  return <ProtectedRoute route={route}>{(permission) => {
    if (permission.outcome === "denied") return <AccessDeniedPage/>;
    const [page, detail] = route.split("/");
    if (page === "asha") return <StaffPortalPage kind="asha" section={detail || "home"}/>;
    if (page === "water-operations") return <StaffPortalPage kind="water" section={detail || "home"}/>;

    const activePage = ["overview", "community", "villages", "surveillance", "outlook", "staff-reports"].includes(page) ? page : "overview";
    let content;
    if (activePage === "overview") content = <DashboardPage onConnectionChange={onConnectionChange}/>;
    else if (activePage === "community") content = <CommunityReportsPage onConnectionChange={onConnectionChange}/>;
    else if (activePage === "villages" && detail) content = <VillageDetailPage villageId={decodeURIComponent(detail)} onConnectionChange={onConnectionChange}/>;
    else if (activePage === "villages") content = <VillagesPage onConnectionChange={onConnectionChange}/>;
    else if (activePage === "surveillance") content = <SurveillancePage onConnectionChange={onConnectionChange}/>;
    else if (activePage === "staff-reports") content = <StaffReportsPage onConnectionChange={onConnectionChange}/>;
    else content = <OutlookPage onConnectionChange={onConnectionChange}/>;
    return <DashboardLayout activePage={activePage} connection={connection} onNavigate={setRoute}>{content}</DashboardLayout>;
  }}</ProtectedRoute>;
}

export default App;
