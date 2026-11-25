import { getGadgets } from "../services/api";
import { useAsyncResource } from "./useAsyncResource";

export function useGadgets(filters) {
  const serializedFilters = JSON.stringify(filters ?? {});
  return useAsyncResource(() => getGadgets(filters), [serializedFilters], {
    cacheKey: `gadgets:${serializedFilters}`,
    ttlMs: 30000,
  });
}
