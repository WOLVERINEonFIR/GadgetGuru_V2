import { Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";

function formatNumber(value, suffix = "") {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "N/A";
  return `${parsed}${suffix}`;
}

function formatPrice(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Price unavailable";
  return `INR ${parsed.toLocaleString()}`;
}

function buildSections(phone) {
  const selectedVariant = phone?.selectedVariant ?? phone?.selected_variant ?? null;

  return [
    {
      title: "Performance",
      rows: [
        { label: "Processor", value: phone?.performance?.chipset ?? phone?.processor_name ?? "N/A" },
        { label: "Tier", value: phone?.performance?.chipset_tier ?? "N/A" },
        { label: "Process", value: formatNumber(phone?.performance?.process_node_nm, " nm") },
        { label: "RAM", value: formatNumber(selectedVariant?.ram_gb ?? phone?.ram_gb, " GB") },
        { label: "Storage", value: formatNumber(selectedVariant?.storage_gb ?? phone?.storage_gb, " GB") },
      ],
    },
    {
      title: "Display",
      rows: [
        { label: "Refresh Rate", value: formatNumber(phone?.display?.refresh_rate_hz ?? phone?.refresh_rate_hz, " Hz") },
        { label: "Peak Brightness", value: formatNumber(phone?.display?.peak_nits, " nits") },
      ],
    },
    {
      title: "Battery",
      rows: [
        { label: "Capacity", value: formatNumber(phone?.battery?.capacity_mah ?? phone?.battery_mah, " mAh") },
        { label: "Charging", value: formatNumber(phone?.charging_watt ?? phone?.battery?.charging_watt, " W") },
      ],
    },
    {
      title: "Camera",
      rows: [
        { label: "Rear Camera", value: formatNumber(phone?.rear_camera_mp ?? phone?.rear_camera_main_mp, " MP") },
        { label: "Rear Lenses", value: formatNumber(phone?.camera?.rear?.lenses?.length) },
        { label: "OIS", value: phone?.camera?.ois ? "Yes" : "No" },
      ],
    },
    {
      title: "Connectivity",
      rows: [
        { label: "5G", value: phone?.has_5g ? "Yes" : "No" },
        { label: "NFC", value: phone?.has_nfc ? "Yes" : "No" },
        { label: "Speaker", value: phone?.physical?.loudspeaker_type ?? "N/A" },
      ],
    },
    {
      title: "Software",
      rows: [
        { label: "Android Updates", value: formatNumber(phone?.software?.major_android_updates_years, " yrs") },
        { label: "Thickness", value: formatNumber(phone?.physical?.thickness_mm, " mm") },
        { label: "Weight", value: formatNumber(phone?.physical?.weight_g, " g") },
      ],
    },
  ];
}

function TechieSpecs({ phone }) {
  if (!phone) return null;

  const sections = buildSections(phone);
  const variants = Array.isArray(phone?.validVariants)
    ? phone.validVariants
    : Array.isArray(phone?.variants)
    ? phone.variants.filter((variant) => Number(variant?.price_inr) > 0)
    : [];

  return (
    <Stack spacing={1.2} sx={{ mt: 1 }}>
      <Grid container spacing={1.2}>
        {sections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 1.4 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{section.title}</Typography>
                <Stack spacing={0.6}>
              {section.rows.map((row) => (
                <Stack key={`${section.title}-${row.label}`} direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                  <Typography variant="caption" fontWeight={700} textAlign="right">{row.value}</Typography>
                </Stack>
              ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {variants.length > 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ p: 1.4 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Variants</Typography>
            <Stack spacing={0.6}>
            {variants.map((variant, index) => (
              <Stack key={`${variant?.ram_gb ?? "ram"}-${variant?.storage_gb ?? "storage"}-${index}`} spacing={0.6}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2">
                  {formatNumber(variant?.ram_gb, "GB")} / {formatNumber(variant?.storage_gb, "GB")}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>{formatPrice(variant?.price_inr)}</Typography>
                </Stack>
                {index < variants.length - 1 ? <Divider /> : null}
              </Stack>
            ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}

export default TechieSpecs;
