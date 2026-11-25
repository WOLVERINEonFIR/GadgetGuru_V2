export function calculateEstimatedPrice(price, releaseYear) {
  if (!price) return price;
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - (releaseYear || currentYear));
  return Math.round(price * Math.pow(0.95, age));
}
