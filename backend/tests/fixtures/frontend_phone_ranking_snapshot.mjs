import fs from "node:fs";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function softCap(score) {
  return 100 * (1 - Math.exp(-score / 100));
}

function getConfidence(device) {
  const missing = device?.parse_quality?.missing_fields_count || 0;
  return Math.max(0.7, 1 - (missing * 0.03));
}

function getChipsetStability(chipset = "") {
  const text = chipset.toLowerCase();
  if (text.includes("snapdragon 8")) return 1.05;
  if (text.includes("dimensity")) return 0.95;
  if (text.includes("tensor")) return 0.80;
  if (text.includes("exynos")) return 0.82;
  return 1.0;
}

function getThermalFactor(device) {
  const node = Number(device?.performance?.process_node_nm || 6);
  const thickness = Number(device?.physical?.thickness_mm || 8);
  const chipset = device?.performance?.chipset || "";
  let score = 1.0;
  if (node <= 3) score += 0.08;
  else if (node >= 6) score -= 0.12;
  if (thickness < 7.8) score -= 0.08;
  score *= getChipsetStability(chipset);
  return Math.max(0.7, Math.min(score, 1.1));
}

function normalizeIntent(intent) {
  const normalized = String(intent ?? "").trim().toLowerCase();
  if (normalized === "photography") return "camera";
  if (normalized === "multimedia" || normalized === "basic") return "balanced";
  return normalized || "balanced";
}

function getValidVariants(device) {
  return (Array.isArray(device?.variants) ? device.variants : []).filter(
    (variant) => toNumber(variant?.price_inr, 0) > 0
  );
}

function getVariantScore(variant, intent) {
  const ramWeight = intent === "gaming" ? 4 : intent === "balanced" ? 3 : 2;
  const storageWeight = intent === "gaming" ? 0.1 : intent === "balanced" ? 0.3 : 0.4;
  return toNumber(variant?.ram_gb, 0) * ramWeight + toNumber(variant?.storage_gb, 0) * storageWeight;
}

function getSelectedVariant(device, budget, intent, isStrict) {
  const validVariants = getValidVariants(device);
  if (validVariants.length === 0) return null;
  const maxAllowedPrice = isStrict ? budget : budget * 1.05;
  const filteredVariants = validVariants.filter((variant) => toNumber(variant?.price_inr, 0) <= maxAllowedPrice);
  const pool = filteredVariants.length > 0 ? filteredVariants : validVariants;
  return pool.reduce((best, variant) => {
    if (!best) return variant;
    const score = getVariantScore(variant, intent);
    const bestScore = getVariantScore(best, intent);
    if (score !== bestScore) return score > bestScore ? variant : best;
    return toNumber(variant?.price_inr, 0) < toNumber(best?.price_inr, 0) ? variant : best;
  }, null);
}

function countLowValueRearLenses(device) {
  const lenses = Array.isArray(device?.camera?.rear?.lenses) ? device.camera.rear.lenses : [];
  return lenses.filter((lens) => toNumber(lens?.mp, 0) <= 2).length;
}

function getRearLensCount(device) {
  const lenses = Array.isArray(device?.camera?.rear?.lenses) ? device.camera.rear.lenses : [];
  return lenses.length;
}

function getCameraWarning(device) {
  const hasMarketingSensors = getRearLensCount(device) >= 3 && countLowValueRearLenses(device) >= 2;
  return hasMarketingSensors ? "Marketing Sensors" : "";
}

function computeBatteryScore(device) {
  const activeUse = device?.battery?.active_use_hours;
  if (activeUse) {
    let score = activeUse * 5;
    const charging = device?.battery?.charging_watt || 0;
    if (charging >= 100) score += 8;
    else if (charging >= 65) score += 5;
    else if (charging >= 30) score += 2;
    const chipset = (device?.performance?.chipset || "").toLowerCase();
    if (chipset.includes("snapdragon 8")) score -= 2;
    if (chipset.includes("dimensity")) score -= 3;
    if (chipset.includes("tensor")) score -= 5;
    if (chipset.includes("exynos")) score -= 4;
    return score;
  }

  const capacity = device?.battery?.capacity_mah || 4500;
  const node = device?.performance?.process_node_nm || 6;
  let score = 50;
  if (capacity >= 6500) score += 15;
  else if (capacity >= 6000) score += 12;
  else if (capacity >= 5000) score += 8;
  else if (capacity <= 4500) score -= 6;
  if (node <= 4) score += 5;
  if (node >= 6) score -= 5;
  return score;
}

function computeGamingScore(device) {
  const baseRaw = device?.scores?.gaming || 50;
  const base = 50 + (baseRaw - 50) * 0.6;
  const thermal = getThermalFactor(device);
  const gpuTier = device?.performance?.gpu_tier;
  const gpuMap = { ultimate: 1.0, flagship: 0.85, upper_mid: 0.7, midrange: 0.5, budget_mid: 0.3, budget: 0.2 };
  const gpuFactor = (typeof gpuTier === "string" && gpuTier in gpuMap) ? gpuMap[gpuTier] : null;
  const peak = base;
  const sustained = peak * thermal;
  let gaming = peak * 0.4 + sustained * 0.6 + (gpuFactor ? gpuFactor * 30 : 0);
  const brand = (device?.brand || "").toLowerCase();
  if (brand.includes("iqoo")) gaming += 4;
  if (brand.includes("asus")) gaming += 5;
  const ram = device?.ram_gb || device?.selectedVariant?.ram_gb || 8;
  if (ram >= 16) gaming += 4;
  else if (ram >= 12) gaming += 2;
  else if (ram <= 6) gaming -= 4;
  const refresh = device?.display?.refresh_rate_hz || 60;
  if (refresh >= 144) gaming += 3;
  else if (refresh >= 120) gaming += 2;
  else if (refresh <= 60) gaming -= 2;
  return Math.max(20, Math.min(gaming, 120));
}

function computeCameraScore(device) {
  const lenses = device?.camera?.rear?.lenses || [];
  if (!lenses.length) return 50;
  let mainLens = lenses.reduce((best, lens) => ((lens?.type === "wide" || !best) ? lens : best), null);
  const mp = mainLens?.mp || 0;
  const hasOIS = !!mainLens?.ois;
  let sensorScore = 50;
  if (mp >= 50) sensorScore += 8;
  else if (mp >= 12) sensorScore += 5;
  else sensorScore -= 5;
  if (hasOIS) sensorScore += 10;
  let opticsScore = 0;
  let hasTelephoto = false;
  let hasPeriscope = false;
  let hasUltrawide = false;
  lenses.forEach((lens) => {
    const type = (lens?.type || "").toLowerCase();
    if (type.includes("periscope")) hasPeriscope = true;
    else if (type.includes("tele")) hasTelephoto = true;
    else if (type.includes("ultra")) hasUltrawide = true;
  });
  if (hasPeriscope) opticsScore += 18;
  else if (hasTelephoto) opticsScore += 10;
  if (hasUltrawide) opticsScore += 6;
  const lowValueCount = lenses.filter((l) => (l?.mp || 0) <= 2).length;
  if (lenses.length >= 3 && lowValueCount >= 2) opticsScore -= 10;
  let videoScore = 0;
  const video = (device?.camera?.video || "").toLowerCase();
  if (video.includes("8k")) videoScore += 10;
  else if (video.includes("4k")) videoScore += 6;
  if (video.includes("hdr")) videoScore += 4;
  const brand = (device?.brand || "").toLowerCase();
  let brandBonus = 0;
  if (brand.includes("google")) brandBonus = 18;
  else if (brand.includes("apple")) brandBonus = 15;
  else if (brand.includes("samsung")) brandBonus = 10;
  else if (brand.includes("vivo")) brandBonus = 10;
  else if (brand.includes("xiaomi")) brandBonus = -4;
  else if (brand.includes("realme")) brandBonus = -6;
  else if (brand.includes("oneplus")) brandBonus = -3;
  else if (brand.includes("infinix")) brandBonus = -8;
  const baseScore = sensorScore + opticsScore + videoScore;
  if (baseScore < 55) brandBonus *= 0.5;
  const currentYear = new Date().getFullYear();
  const age = currentYear - (device?.launch_year || currentYear);
  const ageFactor = Math.max(0.5, 1 - age * 0.12);
  brandBonus = Math.round(brandBonus * ageFactor);
  let camera = sensorScore * 0.5 + opticsScore * 0.3 + videoScore * 0.2 + brandBonus;
  return Math.max(20, Math.min(camera, 120));
}

function computeDisplayScore(device) {
  const display = device?.display || {};
  const refresh = display?.refresh_rate_hz || 60;
  const brightness = display?.peak_nits || display?.hbm_nits || display?.typical_nits || 0;
  const panel = (display?.panel_type || "").toLowerCase();
  let score = 50;
  if (panel.includes("ltpo")) score += 20;
  else if (panel.includes("amoled")) score += 15;
  else if (panel.includes("oled")) score += 12;
  else if (panel.includes("lcd")) score += 5;
  if (refresh >= 144) score += 10;
  else if (refresh >= 120) score += 7;
  else if (refresh >= 90) score += 4;
  if (brightness >= 2500) score += 12;
  else if (brightness >= 1500) score += 8;
  else if (brightness >= 1000) score += 5;
  return score;
}

function scoreGamingIntent(device) {
  const gaming = computeGamingScore(device);
  const display = computeDisplayScore(device);
  const battery = computeBatteryScore(device);
  let penalty = 1;
  if (gaming < 55) penalty = 0.6;
  else if (gaming < 65) penalty = 0.8;
  return (gaming * 0.75 + display * 0.15 + battery * 0.10) * penalty;
}

function scoreCameraIntent(device) {
  const camera = computeCameraScore(device);
  const display = computeDisplayScore(device);
  const battery = computeBatteryScore(device);
  let penalty = 1;
  if (camera < 50) penalty = 0.6;
  else if (camera < 65) penalty = 0.8;
  return (camera * 0.75 + display * 0.15 + battery * 0.10) * penalty;
}

function scoreBatteryIntent(device) {
  const battery = computeBatteryScore(device);
  const display = computeDisplayScore(device);
  const gaming = computeGamingScore(device);
  let penalty = 1;
  if (battery < 45) penalty = 0.6;
  else if (battery < 60) penalty = 0.8;
  return (battery * 0.7 + display * 0.1 + gaming * 0.2) * penalty;
}

function scoreDisplayIntent(device) {
  const display = computeDisplayScore(device);
  const battery = computeBatteryScore(device);
  const gaming = computeGamingScore(device);
  let penalty = 1;
  if (display < 50) penalty = 0.6;
  else if (display < 65) penalty = 0.8;
  return (display * 0.7 + battery * 0.15 + gaming * 0.15) * penalty;
}

function getAgePenalty(device) {
  const year = device?.launch_year || 2024;
  const age = 2026 - year;
  if (age >= 3) return 0.85;
  if (age === 2) return 0.92;
  return 1.0;
}

function scoreBalancedIntent(device) {
  const g = computeGamingScore(device);
  const c = computeCameraScore(device);
  const b = computeBatteryScore(device);
  const d = computeDisplayScore(device);
  const normalize = (s) => Math.max(0, Math.min(1, s / 100));
  const ng = normalize(g);
  const nc = normalize(c);
  const nb = normalize(b);
  const nd = normalize(d);
  const scores = [ng, nc, nb, nd];
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  let variancePenalty = 1;
  if (max - min > 40) variancePenalty = 0.75;
  else if (max - min > 25) variancePenalty = 0.85;
  let floorPenalty = min < 40 ? 0.7 : 1;
  const balanced = (ng + nc + nb + nd) / 4;
  return Math.round((balanced * 100) * variancePenalty * floorPenalty);
}

function computeFinalScoreV2(device, intent) {
  let base;
  switch (intent) {
    case "gaming": base = scoreGamingIntent(device); break;
    case "camera": base = scoreCameraIntent(device); break;
    case "battery": base = scoreBatteryIntent(device); break;
    case "display": base = scoreDisplayIntent(device); break;
    default: base = scoreBalancedIntent(device);
  }
  base *= getConfidence(device);
  base *= getAgePenalty(device);
  return softCap(base);
}

function getBudgetFactor(price, budget) {
  const safeBudget = Math.max(toNumber(budget, 0), 1);
  const ratio = toNumber(price, 0) / safeBudget;
  if (ratio >= 0.8) return 1.0;
  if (ratio >= 0.6) return 0.85;
  return 0.65;
}

function rankDevices(rawData, budget = 30000, intent = "balanced", isStrict = true, priorities = []) {
  if (!Array.isArray(rawData)) return [];
  const normalizedIntent = normalizeIntent(intent);
  const numericBudget = Math.max(toNumber(budget, 30000), 1);
  const maxAllowedPrice = isStrict ? numericBudget : numericBudget * 1.05;
  return rawData
    .map((device) => {
      const validVariants = getValidVariants(device);
      if (validVariants.length === 0) return null;
      const selectedVariant = getSelectedVariant(device, numericBudget, normalizedIntent, isStrict);
      if (!selectedVariant) return null;
      const selectedPrice = toNumber(selectedVariant?.price_inr, 0);
      if (selectedPrice <= 0 || selectedPrice > maxAllowedPrice) return null;
      const cameraWarning = getCameraWarning(device);
      const enrichedDevice = {
        ...device,
        selectedVariant,
        selected_variant: selectedVariant,
        validVariants,
        price_inr: selectedPrice,
        ram_gb: toNumber(selectedVariant?.ram_gb, device?.ram_gb),
        storage_gb: toNumber(selectedVariant?.storage_gb, device?.storage_gb),
        cameraWarning,
        isWorthTheJump: selectedPrice > numericBudget
      };
      const intents = Array.isArray(priorities) && priorities.length > 0 ? priorities : [normalizedIntent];
      let baseFinalScore;
      if (intents.length === 1) {
        baseFinalScore = computeFinalScoreV2(enrichedDevice, intents[0]);
      } else if (intents.length === 2) {
        const score1 = computeFinalScoreV2(enrichedDevice, intents[0]);
        const score2 = computeFinalScoreV2(enrichedDevice, intents[1]);
        baseFinalScore = score1 * 0.5 + score2 * 0.5;
      }
      const finalScore = baseFinalScore * getBudgetFactor(selectedPrice, numericBudget);
      return { ...enrichedDevice, finalScore };
    })
    .filter(Boolean)
    .sort((left, right) => Number(right?.finalScore || 0) - Number(left?.finalScore || 0));
}

const [, , fixturePath, optionsJson] = process.argv;
const devices = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const options = JSON.parse(optionsJson);
const ranked = rankDevices(devices, options.budget, options.intent, options.isStrict, options.priorities);
console.log(JSON.stringify(ranked));
