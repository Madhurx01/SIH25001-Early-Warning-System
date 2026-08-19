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

async function request(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}

export function getOverview(signal) {
  return request("/api/dashboard/overview", signal);
}

export function getVillages(filters = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/villages${query ? `?${query}` : ""}`, signal);
}

export function getVillage(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}`, signal);
}

export function getForecast(signal) {
  return request("/api/dashboard/forecast", signal);
}

export function getRainfallDiseaseTrend(signal) {
  return request("/api/dashboard/rainfall-disease-trend", signal);
}

export function getTasks(signal) {
  return request("/api/tasks", signal);
}

export function getCommunityReports(signal) {
  return request("/api/community-reports", signal);
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
