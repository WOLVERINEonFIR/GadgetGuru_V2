import { useEffect, useState } from "react";

const resourceCache = new Map();
const inflightRequests = new Map();

function getFreshCacheEntry(cacheKey, ttlMs) {
  if (!cacheKey) return null;
  const entry = resourceCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    resourceCache.delete(cacheKey);
    return null;
  }
  return entry;
}

export function useAsyncResource(factory, deps = [], options = {}) {
  const { cacheKey = "", ttlMs = 0 } = options;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      const cached = ttlMs > 0 ? getFreshCacheEntry(cacheKey, ttlMs) : null;
      if (cached) {
        setData(cached.data);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const request = cacheKey && inflightRequests.has(cacheKey)
          ? inflightRequests.get(cacheKey)
          : factory();

        if (cacheKey && !inflightRequests.has(cacheKey)) {
          inflightRequests.set(cacheKey, request);
        }

        const result = await request;

        if (cacheKey) {
          resourceCache.set(cacheKey, { data: result, timestamp: Date.now() });
        }

        if (active) setData(result);
      } catch (fetchError) {
        if (active) setError(fetchError?.message || "Something went wrong.");
      } finally {
        if (cacheKey) inflightRequests.delete(cacheKey);
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [...deps, reloadKey]);

  return {
    data,
    loading,
    error,
    retry: () => {
      if (cacheKey) {
        resourceCache.delete(cacheKey);
        inflightRequests.delete(cacheKey);
      }
      setReloadKey((current) => current + 1);
    },
  };
}
