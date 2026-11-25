import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";

/**
 * LaptopTechieSpecs.jsx
 *
 * Detailed specs panel — rendered inside LaptopCard when expanded.
 * Mirrors TechieSpecs.jsx pattern used in PhoneCard.
 */

function SpecRow({ label, value }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <Stack spacing={0.6}>
      <Stack direction="row" justifyContent="space-between" spacing={1.2}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={600} textAlign="right" sx={{ maxWidth: "62%" }}>
          {String(value)}
        </Typography>
      </Stack>
      <Divider />
    </Stack>
  );
}

function Section({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);
  if (!hasContent) return null;
  return (
    <Card variant="outlined" sx={{ mb: 1.2 }}>
      <CardContent sx={{ p: 1.3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
          {title}
        </Typography>
        <Stack spacing={0.6}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

function LaptopTechieSpecs({ laptop }) {
  if (!laptop) return null;

  const perf    = laptop?.performance ?? {};
  const mem     = laptop?.memory ?? {};
  const disp    = laptop?.display ?? {};
  const bat     = laptop?.battery ?? {};
  const phys    = laptop?.physical ?? {};
  const variant = laptop?.selectedVariant ?? laptop?.variants?.[0] ?? {};
  const scores  = laptop?.scores ?? {};

  return (
    <Stack sx={{ pt: 0.8 }}>

      {/* Scores */}
      <Section title="Scores">
        <SpecRow label="Gaming"       value={scores.gaming       != null ? `${scores.gaming}/100`       : null} />
        <SpecRow label="Coding"       value={scores.coding       != null ? `${scores.coding}/100`       : null} />
        <SpecRow label="Productivity" value={scores.productivity != null ? `${scores.productivity}/100` : null} />
        <SpecRow label="Portability"  value={scores.portability  != null ? `${scores.portability}/100`  : null} />
        <SpecRow label="Multimedia"   value={scores.multimedia   != null ? `${scores.multimedia}/100`   : null} />
      </Section>

      {/* CPU */}
      <Section title="Processor">
        <SpecRow label="CPU"        value={perf.chipset} />
        <SpecRow label="Generation" value={perf.cpu_gen} />
        <SpecRow label="Tier"       value={perf.cpu_tier} />
        <SpecRow label="Cores"      value={perf.cpu_cores} />
        <SpecRow label="TDP"        value={perf.tdp_class ? `${perf.tdp_class}W` : null} />
      </Section>

      {/* GPU */}
      <Section title="Graphics">
        <SpecRow label="GPU"     value={perf.gpu} />
        <SpecRow label="VRAM"    value={perf.gpu_vram_gb ? `${perf.gpu_vram_gb}GB` : null} />
        <SpecRow label="Type"    value={perf.gpu_type} />
      </Section>

      {/* RAM & Storage */}
      <Section title="Memory & Storage">
        <SpecRow label="RAM"          value={variant.ram_gb ? `${variant.ram_gb}GB` : null} />
        <SpecRow label="RAM Type"     value={mem.ram_gen} />
        <SpecRow label="RAM Speed"    value={mem.ram_mhz ? `${mem.ram_mhz}MHz` : null} />
        <SpecRow label="RAM Slots"    value={mem.ram_slots} />
        <SpecRow label="Storage"      value={variant.storage_gb ? (variant.storage_gb >= 1024 ? `${variant.storage_gb/1024}TB` : `${variant.storage_gb}GB`) : null} />
        <SpecRow label="Storage Type" value={mem.storage_type} />
        <SpecRow label="SSD Gen"      value={mem.ssd_gen} />
        <SpecRow label="SSD Slots"    value={mem.ssd_slots} />
        <SpecRow label="HDD Bay"      value={mem.has_hdd_slot ? "Yes" : null} />
      </Section>

      {/* Display */}
      <Section title="Display">
        <SpecRow label="Size"        value={disp.size_inches ? `${disp.size_inches}"` : null} />
        <SpecRow label="Resolution"  value={disp.resolution_str} />
        <SpecRow label="Category"    value={disp.resolution_category} />
        <SpecRow label="Refresh Rate"value={disp.refresh_rate_hz ? `${disp.refresh_rate_hz}Hz` : null} />
        <SpecRow label="Panel"       value={disp.panel_type} />
        <SpecRow label="Brightness"  value={disp.typical_nits ? `${disp.typical_nits} nits` : null} />
        <SpecRow label="Color Gamut" value={disp.gamut} />
      </Section>

      {/* Battery */}
      <Section title="Battery">
        <SpecRow label="Capacity" value={bat.capacity_wh ? `${bat.capacity_wh}Wh` : null} />
      </Section>

      {/* Build */}
      <Section title="Build">
        <SpecRow label="Weight"        value={phys.weight_kg ? `${phys.weight_kg}kg` : null} />
        <SpecRow label="Form Factor"   value={phys.form_factor} />
        <SpecRow label="WiFi"          value={phys.wifi_gen} />
        <SpecRow label="Thunderbolt"   value={phys.has_thunderbolt ? (phys.thunderbolt_ver ? `Thunderbolt ${phys.thunderbolt_ver}` : "Yes") : null} />
        <SpecRow label="USB-C Charging"value={phys.has_usb_c_charging ? "Yes" : null} />
        <SpecRow label="Fingerprint"   value={phys.has_fingerprint ? "Yes" : null} />
      </Section>

      {/* General */}
      <Section title="General">
        <SpecRow label="OS"      value={laptop?.os} />
        <SpecRow label="Warranty"value={laptop?.warranty} />
      </Section>

    </Stack>
  );
}

export default LaptopTechieSpecs;
