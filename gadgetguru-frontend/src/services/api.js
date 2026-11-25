import { API_BASE_URL } from "../config/env";
import { priorityToIntent, adaptRecommendation } from "../lib/recommendAdapter";
import { API_RECOMMEND_PATH } from "../config/env";
import {
  applyCatalogFilters,
  enrichGadget,
  normalizePhoneGadget,
  normalizeUnknownGadget,
  parsePhonesResponse,
  watchlistOffers,
} from "../lib/gadgetData";

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") params.append(key, String(item));
      });
      return;
    }
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
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

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  const body = await parseJson(response);
  const data = unwrapApiBody(body);
  if (response.ok) return data;
  const message =
    (typeof body?.message === "string" && body.message.trim()) ||
    (typeof body?.detail === "string" && body.detail.trim()) ||
    `Request failed with status ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  throw error;
}

function unwrapApiBody(body) {
  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) throw new Error(body.message || "Request failed.");
    return body.data;
  }
  return body;
}

function normalizeFilters(filters = {}) {
  const categories = filters.categories?.length ? filters.categories : ["Phones", "Laptops"];
  return {
    categories,
    brands: filters.brands ?? [],
    minPrice: Number(filters.minPrice ?? filters.min_price ?? 0),
    maxPrice: Number(filters.maxPrice ?? filters.max_price ?? 200000),
    sortBy: filters.sortBy ?? "value",
    minRam: Number(filters.minRam ?? 0),
    minStorage: Number(filters.minStorage ?? 0),
    query: filters.q ?? filters.query ?? "",
    priority: String(filters.priority ?? "balanced").trim().toLowerCase() || "balanced",
  };
}

function hasDefaultSelection(filters = {}) {
  const normalized = normalizeFilters(filters);
  const hasAllCategories =
    normalized.categories.length === 2 &&
    normalized.categories.includes("Phones") &&
    normalized.categories.includes("Laptops");

  return (
    hasAllCategories &&
    normalized.brands.length === 0 &&
    normalized.minPrice === 0 &&
    normalized.maxPrice === 200000 &&
    normalized.priority === "balanced" &&
    normalized.minRam === 0 &&
    normalized.minStorage === 0 &&
    !normalized.query
  );
}

function toBackendParams(filters = {}) {
  const normalized = normalizeFilters(filters);
  const params = {};
  if (normalized.brands.length === 1) params.brand = normalized.brands[0];
  if (normalized.minPrice > 0) params.min_price = normalized.minPrice;
  if (normalized.maxPrice < 200000) params.max_price = normalized.maxPrice;
  if (normalized.minRam > 0) params.minRam = normalized.minRam;
  if (normalized.minStorage > 0) params.minStorage = normalized.minStorage;
  if (normalized.query) params.q = normalized.query;
  if (normalized.priority) {
    params.priority = normalized.priority;
    params.intent = normalized.priority;
  }
  if (normalized.categories.length === 1) {
    params.device_type = normalized.categories[0] === "Phones" ? "phone" : "laptop";
  }
  return params;
}

function filterByQuery(gadgets, query) {
  if (!query) return gadgets;
  const normalizedQuery = query.toLowerCase();
  return gadgets.filter(
    (gadget) =>
      gadget.name.toLowerCase().includes(normalizedQuery) ||
      gadget.brand.toLowerCase().includes(normalizedQuery) ||
      gadget.chipset.toLowerCase().includes(normalizedQuery)
  );
}

function sortRecommendationResults(gadgets, sortBy) {
  const sorted = [...gadgets];
  switch (sortBy) {
    case "price-asc":
      sorted.sort((left, right) => left.price - right.price);
      break;
    case "price-desc":
      sorted.sort((left, right) => right.price - left.price);
      break;
    case "ratings":
      sorted.sort((left, right) => right.rating - left.rating);
      break;
    default:
      break;
  }
  return sorted;
}

function filterRankedRecommendations(gadgets, filters = {}) {
  const categories = filters.categories?.length ? filters.categories : ["Phones", "Laptops"];
  const brands = filters.brands?.length ? filters.brands : [];
  const minPrice = Number(filters.minPrice ?? 0);
  const maxPrice = Number(filters.maxPrice ?? Number.MAX_SAFE_INTEGER);

  const filtered = gadgets.filter((gadget) => {
    const matchesCategory = categories.includes(gadget.category);
    const matchesBrand = brands.length ? brands.includes(gadget.brand) : true;
    const matchesPrice = gadget.price >= minPrice && gadget.price <= maxPrice;
    return matchesCategory && matchesBrand && matchesPrice;
  });

  return sortRecommendationResults(filterByQuery(filtered, filters.query), filters.sortBy);
}

async function loadPhones(filters = {}) {
  const params = toBackendParams(filters);
  const body = await requestJson(`/phones${buildQuery(params)}`, { method: "GET" });
  return parsePhonesResponse(body).map((item, index) => enrichGadget(normalizePhoneGadget(item, index)));
}

export async function getGadgets(filters = {}) {
  const normalized = normalizeFilters(filters);
  const phones = await loadPhones(filters);
  const filtered = applyCatalogFilters(phones, normalized);
  if (normalized.query) {
    const query = normalized.query.toLowerCase();
    return filtered.filter(
      (gadget) =>
        gadget.name.toLowerCase().includes(query) ||
        gadget.brand.toLowerCase().includes(query) ||
        gadget.chipset.toLowerCase().includes(query)
    );
  }
  return filtered;
}

export async function getGadgetById(id) {
  const res = await requestJson("/compare-devices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [id],
      intent: "balanced",
    }),
  });

  console.log("API RAW RESPONSE:", res);

  return res?.devices?.[0] || null;
}

export async function getRecommendations(filters = {}) {
  const normalized = normalizeFilters(filters);

  // Laptops path unchanged (kept for future)
  if (normalized.categories.includes("Laptops") && !normalized.categories.includes("Phones")) {
    return loadLaptops(filters);
  }

  const response = await requestJson(API_RECOMMEND_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: priorityToIntent(normalized.priority),
      price_min: normalized.minPrice,
      price_max: normalized.maxPrice,
      user_text: normalized.query || filters.userText || "",
    }),
  });

  return adaptRecommendation(response);
}

export async function searchGadgets(query) {
  if (!query?.trim()) return [];
  const body = await requestJson("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand: query }),
  });
  const list = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
  return list.map((item, index) => normalizeUnknownGadget(item, index)).filter(Boolean);
}

export async function getOffers() {
  return watchlistOffers;
}
