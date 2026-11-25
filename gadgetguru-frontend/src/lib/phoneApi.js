import { API_BASE_URL } from "../config/env";

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrapApiBody(body) {
  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) {
      throw new Error(body.message || "Request failed.");
    }
    return body.data;
  }
  return body;
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  const body = await parseJson(response);
  const unwrappedBody = unwrapApiBody(body);

  if (response.ok) return unwrappedBody;

  const message =
    (typeof body?.message === "string" && body.message.trim()) ||
    (typeof body?.detail === "string" && body.detail.trim()) ||
    `Request failed with status ${response.status}`;

  throw new Error(message);
}

function postJson(path, payload) {
  return requestJson(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  });
}

export async function fetchPhones() {
  return requestJson("/phones");
}

export async function fetchLaptops() {
  return requestJson("/laptops");
}

export async function fetchRecommendations(filters) {
  return postJson("/recommend", filters);
}

export async function fetchRankedRecommendations(filters) {
  return postJson("/recommendations", filters ?? {});
}

export async function fetchRecommendationsByPriority(priority) {
  const params = new URLSearchParams({ priority: String(priority ?? "").trim() });
  return requestJson(`/recommend?${params.toString()}`);
}

export async function compareDevices(deviceIds, intent = "balanced") {
  return postJson("/compare-devices", {
    device_ids: deviceIds,
    intent,
  });
}
