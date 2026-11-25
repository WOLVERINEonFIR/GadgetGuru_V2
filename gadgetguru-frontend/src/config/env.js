const DEV_DEFAULT_API_BASE = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEV_DEFAULT_API_BASE
).trim().replace(/\/$/, "");
export const API_SEARCH_PATH = "/search";
export const API_RECOMMEND_PATH = "/recommend";