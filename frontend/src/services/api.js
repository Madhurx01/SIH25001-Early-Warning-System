const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

export async function getHealth(signal) {
  const response = await fetch(`${API_BASE_URL}/api/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `API request failed with status ${response.status}`);
  }
  return response.json();
}

export function getOverview(signal) {
  return request("/api/dashboard/overview", { signal });
}

export function getVillages(filters = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/villages${query ? `?${query}` : ""}`, { signal });
}

export function getVillage(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}`, { signal });
}

export function getVillageTrend(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/trend`, { signal });
}

export function getVillageReports(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/community-reports`, { signal });
}

export function getVillageTasks(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/tasks`, { signal });
}

export function getForecast(signal) {
  return request("/api/dashboard/forecast", { signal });
}

export function getRainfallDiseaseTrend(signal) {
  return request("/api/dashboard/rainfall-disease-trend", { signal });
}

export function getTasks(signal) {
  return request("/api/tasks", { signal });
}

export function getTask(taskId, signal) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}`, { signal });
}

export function updateTaskStatus(taskId, status) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function getCommunityReports(signal) {
  return request("/api/community-reports", { signal });
}

export function getCommunityReport(reportId, signal) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}`, { signal });
}

export function updateCommunityReportStatus(reportId, status) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function submitCommunityReport(formData) {
  return request("/api/community-reports", { method: "POST", body: formData });
}

export function getCommunityReportStatus(reportId, signal) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}/status`, { signal });
}

export function communityPhotoUrl(path) {
  return path ? `${API_BASE_URL}${path}` : null;
}

export async function getDashboardData(signal) {
  const [health, overview, villages, forecast, rainfallDiseaseTrend, tasks, communityReports] = await Promise.all([
    getHealth(signal),
    getOverview(signal),
    getVillages({}, signal),
    getForecast(signal),
    getRainfallDiseaseTrend(signal),
    getTasks(signal),
    getCommunityReports(signal),
  ]);
  return { health, overview, villages, forecast, rainfallDiseaseTrend, tasks, communityReports };
}
