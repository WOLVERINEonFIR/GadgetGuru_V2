import { API_BASE_URL, API_SEARCH_PATH } from "../config/env";

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
    if (body.success === false) throw new Error(body.message || "Request failed.");
    return body.data;
  }
  return body;
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  const body = await parseJson(response);
  const data = unwrapApiBody(body);
  if (response.ok) return data;

  const message =
    (typeof body?.message === "string" && body.message.trim()) ||
    (typeof body?.detail === "string" && body.detail.trim()) ||
    `Request failed with status ${response.status}`;
  throw new Error(message);
}

export async function postRefreshPrices(deviceIds) {
  return requestJson("/refresh-prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: deviceIds }),
  });
}

export async function searchPhones(payload) {
  return requestJson(API_SEARCH_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  });
}


import { API_RECOMMEND_PATH } from "../config/env";

export async function postRecommend({ intent, priceMin, priceMax, userText }) {
  return requestJson(API_RECOMMEND_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent,
      price_min: priceMin,
      price_max: priceMax,
      user_text: userText || "",
    }),
  });
}