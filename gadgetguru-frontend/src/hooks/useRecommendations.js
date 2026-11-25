import { getRecommendations } from "../services/api";
import { useAsyncResource } from "./useAsyncResource";

export function useRecommendations(filters) {
  const serializedFilters = JSON.stringify(filters ?? {});
  return useAsyncResource(() => getRecommendations(filters), [serializedFilters], {
    cacheKey: `recommendations:${serializedFilters}`,
    ttlMs: 15000,
  });
}
