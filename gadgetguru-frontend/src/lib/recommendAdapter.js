import { enrichGadget, normalizePhoneGadget } from "./gadgetData";

const PRIORITY_TO_INTENT = {
  balanced: "everyday_value",
  gaming: "performance_gaming",
  camera: "camera_creation",
  battery: "battery_endurance",
  display: "media_productivity",
  design: "design_durability",
};

export function priorityToIntent(priority) {
  return PRIORITY_TO_INTENT[priority] || "everyday_value";
}

export function adaptRecommendation(response) {
  const picks = Array.isArray(response?.picks) ? response.picks : [];
  const summary = response?.summary || "";

  return picks.map((pick, index) => {
    const raw = {
      id: pick.id,
      _id: String(pick.id),
      ...(pick.specs || {}),
      brand: pick.brand,
      model_name: pick.model_name,
      name: pick.model_name,
      price_inr: pick.price_min_inr,
    };
    const gadget = enrichGadget(normalizePhoneGadget(raw, index));

    // v2.1 puts the buy URL in specs.price_offers[], not in any field
    // getGadgetPriceUrl knows about. Pull it explicitly.
    const offerUrl =
      pick.specs?.price_offers?.[0]?.offer_url ||
      pick.specs?.price_offers?.[0]?.source_url ||
      "";

    return {
      ...gadget,
      reason: pick.reason || "",
      summary,
      stretch: pick.stretch === true,
      priceUrl: offerUrl || gadget.priceUrl || "",
      price_url: offerUrl || gadget.price_url || "",
      externalUrl: offerUrl || gadget.externalUrl || "",
    };
  });
}

