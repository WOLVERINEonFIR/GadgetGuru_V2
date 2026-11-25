
function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseObjectId(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && typeof value.$oid === "string") return value.$oid;
  return "";
}

function maxNumber(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((max, value) => Math.max(max, toNumber(value, 0)), 0);
}

function minPositiveNumber(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const positives = values.map(value => toNumber(value, 0)).filter(value => value > 0);
  return positives.length > 0 ? Math.min(...positives) : 0;
}

function getBestPrice(phone) {
  const v2Price = phone?.derived?.filter?.price_min_inr;
  const directPrice = toNumber(
    v2Price ?? phone?.price_inr ?? phone?.price?.sale ?? phone?.price,
    0
  );

  if (directPrice > 0) return directPrice;

  const variantPrice = minPositiveNumber(
    (phone?.variants ?? []).map(variant => variant?.price_inr)
  );

  return variantPrice;
}

function getReleaseYear(phone) {
  const v2Year = phone?.identity?.release_year;
  const fromFilter = toNumber(
    v2Year ?? phone?.derived?.filter?.release_year ?? phone?.filter?.release_year,
    0
  );

  if (fromFilter > 0) return fromFilter;

  const parsedDate = Date.parse(phone?.release_date ?? "");
  if (Number.isFinite(parsedDate)) return new Date(parsedDate).getFullYear();

  return toNumber(phone?.release_year, 0);
}

export function getCheapestVariant(phone) {
  if (!Array.isArray(phone?.variants) || phone.variants.length === 0) return null;

  const priced = phone.variants.filter(variant => toNumber(variant?.price_inr, 0) > 0);
  if (priced.length === 0) return phone.variants[0];

  return priced.reduce((min, variant) =>
    Number(variant.price_inr) < Number(min.price_inr) ? variant : min
  );
}

export function getAllVariants(phone) {
  if (!Array.isArray(phone?.variants)) return [];
  return phone.variants;
}

export function getValidVariants(phone) {
  return getAllVariants(phone).filter(variant => toNumber(variant?.price_inr, 0) > 0);
}

export function getClosestVariant(phone, maxPrice) {
  const variants = getValidVariants(phone);
  if (variants.length === 0) return null;

  const numericMaxPrice = toNumber(maxPrice, Number.POSITIVE_INFINITY);

  const withinBudget = variants.filter(variant => {
    const price = toNumber(variant?.price_inr, 0);
    return price > 0 && price <= numericMaxPrice;
  });

  if (withinBudget.length > 0) {
    return withinBudget.reduce((best, variant) =>
      toNumber(variant?.price_inr, 0) > toNumber(best?.price_inr, 0) ? variant : best
    );
  }

  return getCheapestVariant(phone);
}

function getRam(phone) {
  const cheapestVariant = getCheapestVariant(phone);

  if (toNumber(cheapestVariant?.ram_gb, 0) > 0)
    return toNumber(cheapestVariant.ram_gb, 0);

  if (toNumber(phone?.ram_gb, 0) > 0)
    return toNumber(phone.ram_gb, 0);

  if (Array.isArray(phone?.memory?.ram_options_gb))
    return maxNumber(phone.memory.ram_options_gb);

  if (Array.isArray(phone?.ram))
    return maxNumber(phone.ram);

  if (Array.isArray(phone?.derived?.filter?.ram_options_gb))
    return maxNumber(phone.derived.filter.ram_options_gb);

  if (Array.isArray(phone?.filter?.ram_options_gb))
    return maxNumber(phone.filter.ram_options_gb);

  return 0;
}

function getStorage(phone) {
  const cheapestVariant = getCheapestVariant(phone);

  if (toNumber(cheapestVariant?.storage_gb, 0) > 0)
    return toNumber(cheapestVariant.storage_gb, 0);

  if (toNumber(phone?.storage_gb, 0) > 0)
    return toNumber(phone.storage_gb, 0);

  if (Array.isArray(phone?.memory?.storage_options_gb))
    return maxNumber(phone.memory.storage_options_gb);

  if (Array.isArray(phone?.storage))
    return maxNumber(phone.storage);

  if (Array.isArray(phone?.derived?.filter?.storage_options_gb))
    return maxNumber(phone.derived.filter.storage_options_gb);

  if (Array.isArray(phone?.filter?.storage_options_gb))
    return maxNumber(phone.filter.storage_options_gb);

  return 0;
}

function getRearCameraStats(phone) {
  const lenses = Array.isArray(phone?.camera?.rear?.lenses)
    ? phone.camera.rear.lenses
    : [];

  const lensMps = lenses.map(lens => lens?.mp);
  const bestLensMp = maxNumber(lensMps);

  const directMp = toNumber(
    phone?.rear_camera_main_mp ?? phone?.rear_camera_mp,
    0
  );

  const resolvedMp = directMp > 0 ? directMp : bestLensMp;

  const resolvedCount =
    toNumber(phone?.rear_camera_count, 0) ||
    lenses.length ||
    (resolvedMp > 0 ? 1 : 0);

  return {
    rearCameraMp: resolvedMp,
    rearCameraCount: resolvedCount,
  };
}

export function normalizePhone(rawPhone, index = 0) {
  const phone = rawPhone ?? {};

  const cheapestVariant = getCheapestVariant(phone);
  const validVariants = getValidVariants(phone);

  const model =
    phone?.identity?.model_name ??
    phone?.model ??
    phone?.model_name ??
    phone?.name ??
    `Phone ${index + 1}`;

  const brand =
    phone?.identity?.brand ??
    phone?.brand ??
    phone?.smartphone_brand ??
    "Unknown Brand";

  const objectId = parseObjectId(phone?._id);

  const fallbackId = phone?.id ?? `${brand}-${model}-${index}`;

  const price = getBestPrice(phone);

  const { rearCameraMp, rearCameraCount } = getRearCameraStats(phone);

  const releaseYear = getReleaseYear(phone);

  const hasPriceData =
    Boolean(phone?.derived?.filter?.has_price_data) ||
    Boolean(phone?.filter?.has_price_data) ||
    price > 0;

  const batteryCapacity = toNumber(
    phone?.battery?.capacity_mah ??
    phone?.battery?.capacity ??
    phone?.battery_mah,
    0
  );

  const chargingWatt = toNumber(
    phone?.battery?.charging_watt ??
    phone?.battery?.charging_w ??
    phone?.charging_watt,
    0
  );

  const displaySize = toNumber(
    phone?.display?.size_inches ?? phone?.display_inches,
    0
  );

  const refreshRate = toNumber(
    phone?.display?.refresh_rate_hz ?? phone?.refresh_rate_hz,
    0
  );

  const resolutionHeight = toNumber(
    phone?.display?.resolution_height ?? phone?.res_height_px,
    0
  );

  const chipset =
    phone?.performance?.chipset ??
    phone?.processor_name ??
    "";

  return {
    ...phone,

    _id: objectId || String(fallbackId),
    id: phone?.id ?? fallbackId,

    model,
    model_name: model,
    name: model,

    brand,
    smartphone_brand: brand,

    image_url: phone?.identity?.image_url ?? phone?.image_url ?? phone?.image ?? "",
    image: phone?.identity?.image_url ?? phone?.image ?? phone?.image_url ?? "",

    release_year: releaseYear || undefined,

    price_inr: price,

    price_status: phone?.price_status ?? (hasPriceData ? "live" : "dataset"),

    selected_variant: phone?.selected_variant ?? cheapestVariant,
    selectedVariant: phone?.selectedVariant ?? phone?.selected_variant ?? cheapestVariant,

    validVariants,

    ram_gb: getRam(phone),
    storage_gb: getStorage(phone),

    battery_mah: batteryCapacity,
    charging_watt: chargingWatt,

    display_inches: displaySize,
    refresh_rate_hz: refreshRate,
    res_height_px: resolutionHeight,

    rear_camera_main_mp: rearCameraMp,
    rear_camera_mp: rearCameraMp,
    rear_camera_count: rearCameraCount,

    processor_name: chipset,
  };
}

export function normalizePhoneList(input) {
  const list = Array.isArray(input) ? input : [];
  return list.map((phone, index) => normalizePhone(phone, index));
}

export function computeAvailableOptions(devices, budget) {
  const ramSet = new Set();
  const storageSet = new Set();
  const numericBudget = toNumber(budget, 0);

  devices.forEach(device => {
    if (!Array.isArray(device?.variants)) return;

    device.variants.forEach(variant => {
      const price = toNumber(variant?.price_inr, 0);
      if (price <= 0) return;
      if (price > numericBudget * 1.05) return;

      const ram = toNumber(variant?.ram_gb, 0);
      const storage = toNumber(variant?.storage_gb, 0);

      if (ram > 0) ramSet.add(ram);
      if (storage > 0) storageSet.add(storage);
    });
  });

  return {
    ramOptions: [...ramSet].sort((a, b) => a - b),
    storageOptions: [...storageSet].sort((a, b) => a - b),
  };
}
