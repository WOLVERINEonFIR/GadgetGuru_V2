import { fetchPhones } from "./phoneApi";
import { normalizePhoneList } from "./phoneSchema";

const defaultOffers = [
  { title: "Exchange Bonus", description: "Up to Rs.6,000 extra for eligible trade-ins.", status: "Hot" },
  { title: "Bank Cashback", description: "10% instant discount on selected cards.", status: "Live" },
  { title: "No-Cost EMI", description: "Flexible EMI options from 3 to 12 months.", status: "EMI" },
  { title: "Launch Benefit", description: "Early access bundles and welcome perks.", status: "New" },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function valueOrFallback(value, fallback = "Not listed") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Number.isFinite(value) && value > 0) return String(value);
  return fallback;
}

function getFirstUrl(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function getFirstVariantUrl(variants) {
  if (!Array.isArray(variants)) return "";
  for (const variant of variants) {
    const url = getFirstUrl(variant?.price_url, variant?.priceUrl, variant?.buy_url, variant?.product_url, variant?.url, variant?.link);
    if (url) return url;
  }
  return "";
}

export function getGadgetPriceUrl(gadget) {
  return getFirstUrl(
    gadget?.selectedVariant?.price_url,
    gadget?.selectedVariant?.priceUrl,
    gadget?.selected_variant?.price_url,
    gadget?.selected_variant?.priceUrl,
    getFirstVariantUrl(gadget?.validVariants),
    getFirstVariantUrl(gadget?.variants),
    gadget?.priceUrl,
    gadget?.price_url,
    gadget?.externalUrl,
    gadget?.buy_url,
    gadget?.product_url,
    gadget?.url,
    gadget?.link
  );
}

function formatCompactNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${value}`;
}

export function formatPrice(value) {
  const amount = toNumber(value, 0);
  if (!amount) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function inferReviewCount(score, index) {
  return 120 + Math.round(score * 8) + index * 11;
}

function inferRating(score) {
  const rating = 3.8 + score / 100;
  return Math.min(4.9, Math.round(rating * 10) / 10);
}

function computeRank(score) {
  if (score >= 88) return { label: "Gold Value", tone: "bg-amber-100 text-amber-700 ring-amber-200" };
  if (score >= 78) return { label: "Silver Pick", tone: "bg-slate-100 text-slate-700 ring-slate-200" };
  return { label: "Blue Smart", tone: "bg-blue-100 text-blue-700 ring-blue-200" };
}

export function normalizePhoneGadget(rawPhone, index) {
  const phone = normalizePhoneList([rawPhone])[0];
  const selectedVariant = phone?.selectedVariant ?? phone?.selected_variant ?? phone?.validVariants?.[0] ?? null;
  const price = toNumber(selectedVariant?.price_inr ?? phone?.price_inr, 0);
  const priceUrl = getGadgetPriceUrl(phone);
  const originalPrice = Math.round(price * 1.12);
  const trustScore = Math.round(
    toNumber(phone?.finalScore, 0) ||
      toNumber(phone?.score, 0) ||
      Math.min(
        98,
        48 +
          toNumber(phone?.battery_mah, 0) / 180 +
          toNumber(phone?.ram_gb, 0) * 2 +
          toNumber(phone?.refresh_rate_hz, 60) / 8
      )
  );
  const rank = computeRank(trustScore);

  return {
    ...phone,
    id: phone._id || phone.id || `phone-${index}`,
    category: "Phones",
    brand: phone.brand,
    name: phone.name,
    image: phone.image_url || phone.image || "",
    price,
    originalPrice,
    discountPercent: Math.max(5, Math.round(((originalPrice - price) / Math.max(originalPrice, 1)) * 100)),
    rating: inferRating(trustScore),
    reviewCount: inferReviewCount(trustScore, index),
    trustScore,
    valueRank: rank,
    ram: toNumber(selectedVariant?.ram_gb ?? phone.ram_gb, 0),
    storage: toNumber(selectedVariant?.storage_gb ?? phone.storage_gb, 0),
    battery: toNumber(phone?.battery_mah, 0),
    batterySpecs: phone?.battery && typeof phone.battery === "object"
      ? phone.battery
      : { capacity_mah: toNumber(phone?.battery_mah, 0) },
    display: toNumber(phone.display_inches, 0),
    refreshRate: toNumber(phone.refresh_rate_hz, 60),
    chipset: valueOrFallback(phone.processor_name, "Mobile chipset"),
    camera: toNumber(phone.rear_camera_main_mp ?? phone.rear_camera_mp, 0),
    priceUrl,
    price_url: priceUrl,
    externalUrl: priceUrl || phone?.buy_url || phone?.product_url || phone?.url || "",
    offers: defaultOffers,
    variants:
      phone.validVariants?.length > 0
        ? phone.validVariants.map((variant, variantIndex) => ({
            id: `${phone._id || index}-${variantIndex}`,
            ram: toNumber(variant.ram_gb, 0),
            storage: toNumber(variant.storage_gb, 0),
            price: toNumber(variant.price_inr, 0),
            price_url: getGadgetPriceUrl(variant),
            priceUrl: getGadgetPriceUrl(variant),
          }))
        : [
            {
              id: `${phone._id || index}-default`,
              ram: toNumber(phone.ram_gb, 0),
              storage: toNumber(phone.storage_gb, 0),
              price,
              price_url: priceUrl,
              priceUrl,
            },
          ],
  };
}

export function parsePhonesResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.phones)) return response.phones;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function looksLikePhone(payload) {
  return Boolean(
    payload?.device_type === "phone" ||
      payload?.battery?.capacity_mah ||
      payload?.battery_mah ||
      payload?.rear_camera_mp ||
      payload?.rear_camera_main_mp ||
      payload?.smartphone_brand ||
      payload?.has_5g
  );
}

export function normalizeUnknownGadget(payload, index = 0) {
  if (!payload) return null;
  return enrichGadget(normalizePhoneGadget(payload, index));
}

function buildSpecGroups(gadget) {
  return {
    Performance: [
      ["Chipset", gadget.chipset],
      ["RAM", `${gadget.ram || "?"} GB`],
      ["Storage", `${gadget.storage || "?"} GB`],
    ],
    Display: [
      ["Screen", gadget.display ? `${gadget.display}"` : "Not listed"],
      ["Refresh", `${gadget.refreshRate || 60} Hz`],
    ],
    Battery: [
      ["Capacity", gadget.battery ? `${gadget.battery} mAh` : "Not listed"],
    ],
    Camera: [
      ["Main camera", gadget.camera ? `${gadget.camera} MP` : "Not listed"],
    ],
  };
}

function buildHighlights(gadget) {
  return [
    { label: "Configured RAM", value: `${gadget.ram || "?"} GB` },
    { label: "Storage", value: `${gadget.storage || "?"} GB` },
  ];
}

export function enrichGadget(gadget) {
  return {
    ...gadget,
    highlights: buildHighlights(gadget),
    specGroups: buildSpecGroups(gadget),
  };
}

export async function loadCatalog() {
  const phonesResult = await Promise.allSettled([fetchPhones()]);
  const phones = phonesResult[0];

  if (phones.status !== "fulfilled") {
    throw new Error(phones.reason?.message || "Could not load phones.");
  }

  const gadgets = parsePhonesResponse(phones.value).map((phone, index) =>
    enrichGadget(normalizePhoneGadget(phone, index))
  );

  if (gadgets.length === 0) {
    throw new Error("Could not load gadget catalog.");
  }

  return gadgets.sort((left, right) => left.price - right.price);
}

export function getCatalogCounts(gadgets) {
  const list = Array.isArray(gadgets) ? gadgets : [];
  const categoryCounts = list.reduce((acc, gadget) => {
    acc[gadget.category] = (acc[gadget.category] || 0) + 1;
    return acc;
  }, {});
  const brandCounts = list.reduce((acc, gadget) => {
    acc[gadget.brand] = (acc[gadget.brand] || 0) + 1;
    return acc;
  }, {});
  return { categoryCounts, brandCounts };
}

export function applyCatalogFilters(gadgets, filters) {
  const brands = filters.brands?.length ? filters.brands : [];
  const minPrice = toNumber(filters.minPrice, 0);
  const maxPrice = toNumber(filters.maxPrice, Number.MAX_SAFE_INTEGER);

  const filtered = gadgets.filter((gadget) => {
    const matchesBrand = brands.length ? brands.includes(gadget.brand) : true;
    const matchesPrice = gadget.price >= minPrice && gadget.price <= maxPrice;
    return matchesBrand && matchesPrice;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
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
      sorted.sort((left, right) => left.price - right.price);
      break;
  }
  return sorted;
}

export const quickPriceRanges = [
  { label: "Under ₹20k", min: 0, max: 20000 },
  { label: "₹20k–₹40k", min: 20000, max: 40000 },
  { label: "₹40k–₹70k", min: 40000, max: 70000 },
  { label: "₹70k+", min: 70000, max: 200000 },
];

export const compareSpecs = [
  { key: "price", label: "Current price", format: (value) => formatPrice(value), better: "low" },
  { key: "ram", label: "RAM", format: (value) => `${value} GB`, better: "high" },
  { key: "storage", label: "Storage", format: (value) => `${value} GB`, better: "high" },
  { key: "battery", label: "Battery", format: (value) => `${value} mAh`, better: "high" },
  { key: "refreshRate", label: "Refresh rate", format: (value) => `${value} Hz`, better: "high" },
];

export const watchlistOffers = defaultOffers;