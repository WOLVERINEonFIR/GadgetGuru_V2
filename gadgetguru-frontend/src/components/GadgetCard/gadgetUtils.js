const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%23f4f6f8'/%3E%3Ctext x='150' y='94' text-anchor='middle' font-family='Arial' font-size='18' fill='%235F6368'%3EGadget%3C/text%3E%3C/svg%3E";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPrice(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Price unavailable";
  return `₹${parsed.toLocaleString("en-IN")}`;
}

function getGadgetId(gadget) {
  return String(gadget?._id ?? gadget?.id ?? gadget?.model_name ?? gadget?.model ?? gadget?.name ?? "");
}

function getGadgetName(gadget) {
  return gadget?.model_name ?? gadget?.model ?? gadget?.name ?? "Unknown gadget";
}

function getGadgetBrand(gadget) {
  return gadget?.brand ?? gadget?.smartphone_brand ?? "Unknown brand";
}

export { PLACEHOLDER_IMAGE, formatPrice, getGadgetBrand, getGadgetId, getGadgetName, toNumber };
