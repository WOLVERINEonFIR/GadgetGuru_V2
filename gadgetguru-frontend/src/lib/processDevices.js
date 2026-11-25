import { fetchRankedRecommendations } from "./phoneApi";

export const processDevices = async (_rawData, config) => {
  const {
    budget = 30000,
    intent = "balanced",
    isStrict = true,
    priorities = [],
    brand = "",
    minRam = 0,
    minStorage = 0,
    limit = 200,
  } = config ?? {};

  const response = await fetchRankedRecommendations({
    device_type: "phone",
    priority: intent,
    priorities,
    maxPrice: budget,
    strictMode: isStrict,
    minRam,
    minStorage,
    limit,
    brand: brand || undefined,
  });

  return Array.isArray(response?.results) ? response.results : [];
};
