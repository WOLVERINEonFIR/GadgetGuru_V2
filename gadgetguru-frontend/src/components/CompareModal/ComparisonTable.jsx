import { Box, Stack, Typography } from "@mui/material";

const SPEC_FIELD_MAP = {
  display: [
    { label: "Size", path: ["display", "size_inches"], format: (v) => (v ? `${v}"` : "-") },
    { label: "Resolution", path: ["display", "resolution_width", "resolution_height"], format: (v, data) => {
      const width = data?.display?.resolution_width ?? data?.resolution_width_px ?? "";
      const height = data?.display?.resolution_height ?? data?.res_height_px ?? "";
      return width && height ? `${width} x ${height}` : "-";
    }},
    { label: "Refresh Rate", path: ["display", "refresh_rate_hz"], format: (v) => (v ? `${v} Hz` : "-") },
    { label: "Panel Type", path: ["display", "panel_type"], format: (v) => v || "-" },
    { label: "PPI", path: ["filter", "display_ppi"], format: (v) => (v ? `${v} PPI` : "-") },
  ],
  performance: [
    { label: "Chipset", path: ["performance", "chipset"], format: (v) => v || "-" },
    { label: "GPU", path: ["performance", "gpu"], format: (v) => v || "-" },
    { label: "Process Node", path: ["performance", "process_node_nm"], format: (v) => (v ? `${v}nm` : "-") },
    { label: "Chipset Tier", path: ["performance", "chipset_tier"], format: (v) => v || "-" },
  ],
  battery: [
    { label: "Capacity", path: ["battery", "capacity_mah"], format: (v) => (v ? `${v} mAh` : "-") },
    { label: "Active Use", path: ["battery", "active_use_hours"], format: (v) => (v ? `${v} hrs` : "-") },
    { label: "Charging", path: ["battery", "charging_watt"], format: (v) => (v ? `${v}W` : "-") },
  ],
  camera: [
    { label: "Rear Main", path: ["camera", "rear_main_mp"], format: (v) => (v ? `${v} MP` : "-") },
    { label: "Selfie", path: ["camera", "selfie_mp"], format: (v) => (v ? `${v} MP` : "-") },
    { label: "OIS", path: ["camera", "ois"], format: (v) => (v === true ? "Yes" : v === false ? "No" : "-") },
  ],
  build: [
    { label: "Weight", path: ["build", "weight"], format: (v) => (v ? `${v}g` : "-") },
    { label: "Thickness", path: ["build", "thickness"], format: (v) => (v ? `${v}mm` : "-") },
    { label: "IP Rating", path: ["build", "ip_rating"], format: (v) => v || "-" },
  ],
  connectivity: [
    { label: "5G", path: ["connectivity", "5g"], format: (v) => (v === true ? "Yes" : v === false ? "No" : "-") },
    { label: "NFC", path: ["connectivity", "nfc"], format: (v) => (v === true ? "Yes" : v === false ? "No" : "-") },
    { label: "Bluetooth", path: ["connectivity", "bluetooth_version"], format: (v) => v || "-" },
  ],
  memory: [
    { label: "Max RAM", path: ["filter", "ram_options_gb"], format: (v) => {
      if (!Array.isArray(v) || v.length === 0) return "-";
      const maxRam = Math.max(...v.filter((n) => typeof n === "number" && n > 0));
      return maxRam > 0 ? `${maxRam} GB` : "-";
    }},
    { label: "Max Storage", path: ["filter", "storage_options_gb"], format: (v) => {
      if (!Array.isArray(v) || v.length === 0) return "-";
      const maxStorage = Math.max(...v.filter((n) => typeof n === "number" && n > 0));
      if (maxStorage >= 1024) return `${maxStorage / 1024} TB`;
      return maxStorage > 0 ? `${maxStorage} GB` : "-";
    }},
    { label: "Expandable", path: ["expandable_storage"], format: (v) => (v === true ? "Yes" : v === false ? "No" : "-") },
  ],
  software: [
    { label: "Android", path: ["software", "android_version"], format: (v) => v || "-" },
    { label: "Update Years", path: ["software", "update_years"], format: (v) => (v ? `${v} years` : "-") },
  ],
};

function getNestedValue(obj, paths) {
  let current = obj;
  for (const path of paths) {
    if (current == null) return undefined;
    current = current[path];
  }
  return current;
}

function ComparisonTable({ section, devices, getHighlightForDevice }) {
  const specs = SPEC_FIELD_MAP[section.key] ?? [];

  if (specs.length === 0) return null;

  const highlightMap = {};
  devices.forEach((device) => {
    const deviceId = device._id ?? device.id ?? device.model_name ?? device.model ?? device.name;
    highlightMap[deviceId] = getHighlightForDevice(deviceId) ?? {};
  });

  return (
    <>
      <Box
        sx={{
          gridColumn: "1 / -1",
          py: 1,
          px: 1,
          bgcolor: "grey.100",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", color: "text.secondary" }}>
          {section.label}
        </Typography>
      </Box>

      <Box sx={{ 
        py: 1.5, 
        px: 1, 
        borderBottom: "1px solid", 
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        bgcolor: "grey.50",
      }}>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          Spec
        </Typography>
      </Box>

      {specs.map((spec, specIndex) => {
        const specKey = spec.label.toLowerCase().replace(/\s+/g, "_");
        
        return (
          <Box key={spec.label}>
            <Box sx={{ 
              py: 1.5, 
              px: 1, 
              borderBottom: "1px solid", 
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              bgcolor: "grey.50",
            }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {spec.label}
              </Typography>
            </Box>

            {devices.map((device, deviceIndex) => {
              const deviceId = device._id ?? device.id ?? device.model_name ?? device.model ?? device.name;
              const highlights = highlightMap[deviceId] ?? {};
              const isHighlighted = highlights[section.key] === true;
              
              const value = getNestedValue(device, spec.path);
              const displayValue = spec.format(value, device);

              return (
                <Box
                  key={`${deviceId}-${specIndex}`}
                  sx={{
                    py: 1.5,
                    px: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: isHighlighted ? "rgba(34, 197, 94, 0.1)" : "background.paper",
                    borderLeft: isHighlighted ? "3px solid" : "1px solid",
                    borderLeftColor: isHighlighted ? "success.main" : "divider",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: isHighlighted ? 600 : 400 }}>
                    {displayValue}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </>
  );
}

export default ComparisonTable;
