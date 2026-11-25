
// src/lib/specs.js

export const NOT_AVAILABLE = "Not Available";

const PATH_TOKEN_REGEX = /[^.[\]]+|\[(\d+)\]/g;

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isMissing = (value) =>
  value === null ||
  value === undefined ||
  value === "" ||
  value === "N/A" ||
  value === "null";

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const tokenizePath = (path) => {
  if (!path) return [];

  return (
    path.match(PATH_TOKEN_REGEX)?.map((token) => {
      const numeric = Number(token);

      return Number.isInteger(numeric) && String(numeric) === token
        ? numeric
        : token;
    }) ?? []
  );
};

export const getValue = (obj, path) => {
  if (!obj || !path) return undefined;

  return tokenizePath(path).reduce((current, token) => {
    if (current === null || current === undefined) return undefined;
    return current[token];
  }, obj);
};

const getFirstValue = (...values) =>
  values.find((value) => !isMissing(value));

const formatResolution = (value) => {
  if (isMissing(value)) return NOT_AVAILABLE;

  if (typeof value === "string") return value;

  const width = value.width_px ?? value.width;
  const height = value.height_px ?? value.height;

  return width != null && height != null
    ? `${width} × ${height}`
    : NOT_AVAILABLE;
};

const formatMaterials = (value) => {
  if (isMissing(value)) return NOT_AVAILABLE;

  if (typeof value === "string") return value;

  const parts = [];

  if (value.front_material) parts.push(`Front: ${value.front_material}`);
  if (value.back_material) parts.push(`Back: ${value.back_material}`);
  if (value.frame_material) parts.push(`Frame: ${value.frame_material}`);

  return parts.length ? parts.join(" / ") : value.raw ?? NOT_AVAILABLE;
};

const formatCameraLenses = (lenses) => {
  if (!Array.isArray(lenses) || lenses.length === 0) {
    return NOT_AVAILABLE;
  }

  return (
    lenses
      .map((lens) => {
        if (!lens) return null;

        const mp = lens.resolution_mp;
        const type = lens.type;
        const aperture = lens.aperture;

        if (mp != null && type) {
          return `${mp} MP (${type})`;
        }

        if (mp != null) return `${mp} MP`;
        if (type) return type;

        return lens.raw ?? null;
      })
      .filter(Boolean)
      .join(", ") || NOT_AVAILABLE
  );
};

const formatVideoCapabilities = (value) => {
  if (isMissing(value)) return NOT_AVAILABLE;

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || NOT_AVAILABLE;
  }

  return formatObjectValue(value);
};

const formatObjectValue = (value) => {
  if (isMissing(value)) return NOT_AVAILABLE;

  if (Array.isArray(value)) {
    return value.map(formatObjectValue).filter(Boolean).join(", ");
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, val]) => !isMissing(val))
      .map(([key, val]) => `${key}: ${formatObjectValue(val)}`)
      .join(", ");
  }

  return String(value);
};

const formatArrayValue = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return NOT_AVAILABLE;
  }

  return (
    value
      .map((item) => {
        if (isMissing(item)) return null;

        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }

        if (isPlainObject(item)) {
          const label = getFirstValue(
            item.label,
            item.name,
            item.model,
            item.type,
            item.raw
          );

          if (label) return String(label);

          if (item.resolution_mp != null) {
            return `${item.resolution_mp} MP`;
          }

          return formatObjectValue(item);
        }

        return String(item);
      })
      .filter(Boolean)
      .join(", ") || NOT_AVAILABLE
  );
};

// Camera modules are selected by their position, never by fixed array index.
const getCameraModule = (device, position) =>
  device?.cameras?.modules?.find((module) => module?.position === position);

const formatRearCamera = (device) =>
  formatCameraLenses(getCameraModule(device, "rear")?.lenses);

const formatFrontCamera = (device) =>
  formatCameraLenses(getCameraModule(device, "front")?.lenses);

const formatRearVideo = (device) =>
  formatVideoCapabilities(
    getCameraModule(device, "rear")?.video_capabilities
  );

const formatFrontVideo = (device) =>
  formatVideoCapabilities(
    getCameraModule(device, "front")?.video_capabilities
  );

export const formatValue = (value, field, device) => {
  if (field?.formatter) {
    return field.formatter(device, value);
  }

  if (isMissing(value)) return NOT_AVAILABLE;

  const path = field?.path ?? "";

  // Resolution
  if (path.endsWith(".resolution")) {
    return formatResolution(value);
  }

  // Materials
  if (path === "physical.materials") {
    return formatMaterials(value);
  }

  // Physical dimensions
  if (path === "physical.dimensions_mm.standard") {
    const dimensions = value;

    if (
      dimensions?.length_mm != null &&
      dimensions?.width_mm != null &&
      dimensions?.thickness_mm != null
    ) {
      return `${dimensions.length_mm} × ${dimensions.width_mm} × ${dimensions.thickness_mm} mm`;
    }

    return formatObjectValue(dimensions);
  }

  // Battery capacity
  if (path.endsWith("capacity_mah")) {
    const number = toNumber(value);
    return number !== null ? `${number} mAh` : NOT_AVAILABLE;
  }

  // Display size
  if (path.endsWith("size_inches")) {
    const number = toNumber(value);
    return number !== null ? `${number} in` : NOT_AVAILABLE;
  }

  // Refresh rate
  if (path.endsWith("refresh_rate_hz")) {
    const number = toNumber(value);
    return number !== null ? `${number} Hz` : NOT_AVAILABLE;
  }

  // Weight
  if (path.endsWith("weight_g")) {
    const number = toNumber(value);
    return number !== null ? `${number} g` : NOT_AVAILABLE;
  }

  // Thickness
  if (path.endsWith("thickness_mm")) {
    const number = toNumber(value);
    return number !== null ? `${number} mm` : NOT_AVAILABLE;
  }

  // Process node
  if (path.endsWith("process_nm")) {
    const number = toNumber(value);
    return number !== null ? `${number} nm` : NOT_AVAILABLE;
  }

  // Brightness
  if (path.endsWith("brightness_nits")) {
    const number = toNumber(value);
    return number !== null ? `${number} nits` : NOT_AVAILABLE;
  }

  // Pixel density
  if (path.endsWith("display_ppi") || path.endsWith(".ppi")) {
    const number = toNumber(value);
    return number !== null ? `${number} PPI` : NOT_AVAILABLE;
  }

  // Charging power
  if (path.endsWith("max_power_w")) {
    const number = toNumber(value);
    return number !== null ? `${number} W` : NOT_AVAILABLE;
  }

  // Active-use duration
  if (path.endsWith("active_use_score_minutes")) {
    const number = toNumber(value);
    return number !== null ? `${number} minutes` : NOT_AVAILABLE;
  }

  // Boolean values
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Arrays
  if (Array.isArray(value)) {
    return formatArrayValue(value);
  }

  // Objects
  if (isPlainObject(value)) {
    return formatObjectValue(value);
  }

  return String(value);
};

const specConfigObject = {
  Performance: [
    { label: "Chipset", path: "performance.chipset.model" },
    { label: "CPU", path: "performance.cpu.description" },
    { label: "GPU", path: "performance.gpu.model" },
    { label: "Process Node", path: "performance.chipset.process_nm" },
  ],

  Display: [
    { label: "Screen Size", path: "displays.0.size_inches" },
    { label: "Resolution", path: "displays.0.resolution" },
    { label: "Refresh Rate", path: "displays.0.refresh_rate_hz" },
    { label: "Panel Type", path: "displays.0.technology" },
    { label: "Peak Brightness", path: "displays.0.peak_brightness_nits" },
    { label: "HBM Brightness", path: "displays.0.hbm_brightness_nits" },
    { label: "Typical Brightness", path: "displays.0.typical_brightness_nits" },
    { label: "HDR Formats", path: "displays.0.hdr_formats" },
    { label: "Protection", path: "displays.0.protection" },
    { label: "PPI", path: "displays.0.ppi" },
    { label: "LTPO", path: "derived.filter.is_ltpo" },
  ],

  Battery: [
    { label: "Capacity", path: "batterySpecs.capacity_mah" },
    { label: "Active Use", path: "batterySpecs.active_use_score_minutes" },
    { label: "Wired Charging", path: "batterySpecs.wired_charging.max_power_w" },
    { label: "Charging Protocols", path: "batterySpecs.wired_charging.protocols" },
    { label: "Wireless Charging", path: "batterySpecs.wireless_charging.supported" },
    { label: "Wireless Charging Wattage", path: "batterySpecs.wireless_charging.max_power_w" },
    { label: "Reverse Wired Charging", path: "batterySpecs.reverse_charging.wired_supported" },
    { label: "Reverse Wireless Charging", path: "batterySpecs.reverse_charging.wireless_supported" },
  ],

  Camera: [
    {
      label: "Rear Lenses",
      path: "cameras.modules",
      formatter: (device) => formatRearCamera(device),
    },
    {
      label: "Rear Video",
      path: "cameras.modules",
      formatter: (device) => formatRearVideo(device),
    },
    {
      label: "Front Camera",
      path: "cameras.modules",
      formatter: (device) => formatFrontCamera(device),
    },
    {
      label: "Front Video",
      path: "cameras.modules",
      formatter: (device) => formatFrontVideo(device),
    },
    { label: "OIS", path: "cameras.overall_ois_claim" },
  ],

  Connectivity: [
    { label: "Wi-Fi", path: "connectivity.wifi.generation" },
    { label: "Bluetooth", path: "connectivity.bluetooth.version" },
    { label: "NFC", path: "connectivity.nfc.supported" },
    { label: "Infrared", path: "connectivity.infrared_port" },
    { label: "5G Bands", path: "connectivity.5g_bands" },
    { label: "SIM Configuration", path: "connectivity.sim_configurations.0.raw" },
    { label: "FM Radio", path: "connectivity.fm_radio" },
    { label: "USB", path: "connectivity.usb.usb_standard" },
    { label: "Positioning", path: "connectivity.positioning.systems" },
  ],

  Physical: [
    { label: "Weight", path: "physical.weight_g" },
    { label: "Thickness", path: "physical.dimensions_mm.standard.thickness_mm" },
    { label: "Materials", path: "physical.materials" },
    { label: "Water Resistance", path: "physical.water_resistance.rating" },
    { label: "Headphone Jack", path: "physical.headphone_jack" },
    { label: "Form Factor", path: "physical.form_factor" },
    { label: "Colors", path: "physical.colors" },
    { label: "Dimensions", path: "physical.dimensions_mm.standard" },
  ],

  Software: [
    { label: "Operating System", path: "software.operating_system" },
    { label: "Launch OS", path: "performance.operating_system_at_launch" },
    { label: "Major OS Updates", path: "software.update_policy.major_os_updates" },
    { label: "Security Updates (Years)", path: "software.update_policy.security_updates_years" },
    { label: "User Interface", path: "software.user_interface.0.name" },
    { label: "UI Version", path: "software.user_interface.0.version" },
  ],
};

export const specConfig = Object.entries(specConfigObject).map(
  ([section, fields]) => ({
    section,
    fields,
  })
);
