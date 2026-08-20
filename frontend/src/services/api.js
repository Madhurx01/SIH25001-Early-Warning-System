import { getStoredToken, handleCurrentTokenFailure, invalidateSession } from "../auth/session.js";

const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

export async function getHealth(signal) {
  const response = await fetch(`${API_BASE_URL}/api/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

async function requestResponse(path, options = {}, { protectedRequest = false } = {}) {
  const token = protectedRequest ? getStoredToken() : "";
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && protectedRequest) {
    handleCurrentTokenFailure(token, () => invalidateSession());
  }
  return response;
}

async function request(path, options = {}, requestOptions = {}) {
  const response = await requestResponse(path, options, requestOptions);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.detail || `API request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function loginStaff(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(signal) {
  return request("/api/auth/me", { signal }, { protectedRequest: true });
}

export function getPublicVillages(signal) {
  return request("/api/public/villages", { signal });
}

export function getOverview(signal) {
  return request("/api/dashboard/overview", { signal }, { protectedRequest: true });
}

export function getVillages(filters = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/villages${query ? `?${query}` : ""}`, { signal }, { protectedRequest: true });
}

export function getVillage(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}`, { signal }, { protectedRequest: true });
}

export function getVillageTrend(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/trend`, { signal }, { protectedRequest: true });
}

export function getVillageReports(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/community-reports`, { signal }, { protectedRequest: true });
}

export function getVillageTasks(villageId, signal) {
  return request(`/api/villages/${encodeURIComponent(villageId)}/tasks`, { signal }, { protectedRequest: true });
}

export function getForecast(signal) {
  return request("/api/dashboard/forecast", { signal }, { protectedRequest: true });
}

export function getRainfallDiseaseTrend(signal) {
  return request("/api/dashboard/rainfall-disease-trend", { signal }, { protectedRequest: true });
}

export function getTasks(signal) {
  return request("/api/tasks", { signal }, { protectedRequest: true });
}

export function updateTaskAssignment(taskId, assignedRole, assignedUserId = null) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}/assignment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigned_role: assignedRole, assigned_user_id: assignedUserId }),
  }, { protectedRequest: true });
}

export function getTask(taskId, signal) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}`, { signal }, { protectedRequest: true });
}

export function updateTaskStatus(taskId, status) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }, { protectedRequest: true });
}

export function getCommunityReports(signal) {
  return request("/api/community-reports", { signal }, { protectedRequest: true });
}

export function getCommunityReport(reportId, signal) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}`, { signal }, { protectedRequest: true });
}

export function updateCommunityReportStatus(reportId, status) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }, { protectedRequest: true });
}

export function submitCommunityReport(formData) {
  return request("/api/community-reports", { method: "POST", body: formData });
}

export function getCommunityReportStatus(reportId, signal) {
  return request(`/api/community-reports/${encodeURIComponent(reportId)}/status`, { signal });
}

export async function getCommunityPhoto(path, signal) {
  const response = await requestResponse(path, { signal }, { protectedRequest: true });
  if (!response.ok) {
    const error = new Error(`Photo evidence failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return URL.createObjectURL(await response.blob());
}

export function getAssignedVillages(signal) {
  return request("/api/staff/assigned-villages", { signal }, { protectedRequest: true });
}

export function getHealthReports(signal) {
  return request("/api/health-reports", { signal }, { protectedRequest: true });
}

export function submitHealthReport(report) {
  return request("/api/health-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  }, { protectedRequest: true });
}

export function getWaterReports(signal) {
  return request("/api/water-reports", { signal }, { protectedRequest: true });
}

export function submitWaterReport(report) {
  return request("/api/water-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  }, { protectedRequest: true });
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
