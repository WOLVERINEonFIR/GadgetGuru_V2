import { useMemo, useState } from "react";
import BatteryChargingFullRoundedIcon from "@mui/icons-material/BatteryChargingFullRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import TechieSpecs from "./TechieSpecs";
import { CompareContext, useCompare } from "../context/CompareContext";
import { getGadgetPriceUrl } from "../lib/gadgetData";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPrice(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Price unavailable";
  return `INR ${parsed.toLocaleString()}`;
}

function formatStorage(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "N/A";
  if (parsed >= 1024 && parsed % 1024 === 0) return `${parsed / 1024}TB`;
  return `${parsed}GB`;
}

function getIntentLabel(selectedPriority) {
  const normalized = String(selectedPriority ?? "").trim().toLowerCase();
  if (normalized === "photography") return "camera";
  if (normalized === "multimedia" || normalized === "basic") return "balanced";
  return normalized || "balanced";
}

function getHeroSpec(phone, intent) {
  switch (intent) {
    case "gaming":
      return phone?.performance?.chipset ?? phone?.processor_name ?? "Performance tuned";
    case "battery":
      return `${toNumber(phone?.battery?.capacity_mah ?? phone?.battery_mah, 0) || "All-day"} mAh`;
    case "display":
      return `${toNumber(phone?.display?.refresh_rate_hz ?? phone?.refresh_rate_hz, 0) || 60} Hz`;
    case "camera":
      return `${toNumber(phone?.scores?.camera ?? phone?.rear_camera_mp ?? phone?.rear_camera_main_mp, 0) || "Smart"} camera focus`;
    default:
      return `${toNumber(phone?.derivedScores?.longevityScore ?? 0, 0) || toNumber(phone?.finalScore ?? 0, 0)} Balanced Rank`;
  }
}

function getDerivedScoreLabel(phone, intent) {
  switch (intent) {
    case "gaming":
      return `${Math.round(toNumber(phone?.derivedScores?.sustainedGaming, phone?.scores?.gaming))} Gaming Rank`;
    case "battery":
      return `${Math.round(toNumber(phone?.derivedScores?.trueEndurance, phone?.scores?.battery))} Endurance Rank`;
    case "camera":
      return `${Math.round(toNumber(phone?.scores?.camera, 0))} Camera Rank`;
    case "display":
      return `${Math.round(toNumber(phone?.scores?.display, 0))} Display Rank`;
    default:
      return `${Math.round(toNumber(phone?.derivedScores?.longevityScore, phone?.finalScore))} Value Rank`;
  }
}

function buildBadges(phone, intent) {
  const badges = [];
  if (intent === "gaming" && toNumber(phone?.derivedScores?.sustainedGaming, 0) >= 85) badges.push("Elite Gaming");
  if (phone?.isWorthTheJump) badges.push("Worth the Jump");
  if (phone?.cameraWarning) badges.push(`⚠ ${phone.cameraWarning}`);
  return badges;
}

function getCategoryColor(intent) {
  if (intent === "gaming") return "secondary";
  if (intent === "battery") return "success";
  if (intent === "camera") return "warning";
  return "primary";
}

function PhoneCard({
  phone,
  index = 0,
  showSpecsByDefault = false,
  expandableSpecs = true,
  selectedPriority = "",
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(showSpecsByDefault);
  const [saved, setSaved] = useState(false);
  const intent = getIntentLabel(selectedPriority);
  const selectedVariant = phone?.selectedVariant ?? phone?.selected_variant ?? null;
  const priceUrl = getGadgetPriceUrl(phone);
  const badges = useMemo(() => buildBadges(phone, intent), [phone, intent]);
  const image = phone?.image_url || phone?.image || "/placeholder.png";
  const name = phone?.model_name || phone?.model || phone?.name || "Unknown Model";
  const brand = phone?.brand || phone?.smartphone_brand || "Unknown Brand";
  const reviewCount = Math.max(48, Math.round(toNumber(phone?.reviews_count ?? phone?.review_count ?? phone?.finalScore, 84)));
  const rating = Math.min(5, Math.max(3.8, Number((toNumber(phone?.finalScore ?? phone?.scores?.overall, 80) / 20).toFixed(1))));
  
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(phone);
  const specRows = [
    {
      icon: <BatteryChargingFullRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: `${toNumber(phone?.battery?.capacity_mah ?? phone?.battery_mah, 0) || "All-day"} mAh`,
    },
    {
      icon: <MemoryRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: `${toNumber(selectedVariant?.ram_gb, phone?.ram_gb) || "-"} GB RAM`,
    },
    {
      icon: <SpeedRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: getHeroSpec(phone, intent),
    },
  ];

  return (
    <Card
      component={motion.article}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.26 }}
      elevation={0}
      sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Media */}
      <Box sx={{ position: "relative", pt: "65%", overflow: "hidden" }}>
        <Box
          component="img"
          src={image}
          alt={name}
          loading="lazy"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.35s ease",
            ".MuiCard-root:hover &": { transform: "scale(1.05)" },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(15,23,42,0.02) 35%, rgba(15,23,42,0.74) 100%)",
          }}
        />
        <Tooltip title={saved ? "Saved" : "Save"} arrow>
          <IconButton
            aria-label={saved ? "Remove bookmark" : "Save gadget"}
            onClick={() => setSaved((previous) => !previous)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: "rgba(255,255,255,0.9)",
              "&:hover": { bgcolor: "common.white" },
            }}
          >
            <Box
              component={motion.span}
              animate={reduceMotion ? {} : { scale: saved ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.22 }}
              sx={{ display: "inline-flex" }}
            >
              {saved ? <BookmarkRoundedIcon color="primary" /> : <BookmarkBorderRoundedIcon />}
            </Box>
          </IconButton>
        </Tooltip>
        <Chip
          label="Quick View"
          size="small"
          sx={{
            position: "absolute",
            left: 14,
            bottom: 14,
            color: "common.white",
            bgcolor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.22)",
          }}
        />
      </Box>

      {/* Content */}
      <CardContent sx={{ pb: 2, display: "flex", flexDirection: "column", gap: 1.5, flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Chip label={brand} variant="outlined" color={getCategoryColor(intent)} size="small" />
          <Typography variant="caption" color="text.secondary">
            {getDerivedScoreLabel(phone, intent)}
          </Typography>
        </Stack>

        <Box>
          <Typography
            variant="h6"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "3rem",
            }}
          >
            {name}
          </Typography>
          <Typography variant="body2">
            {toNumber(selectedVariant?.ram_gb, phone?.ram_gb) || "-"} GB / {formatStorage(selectedVariant?.storage_gb ?? phone?.storage_gb)}
          </Typography>
        </Box>

        <Stack spacing={1}>
          {specRows.map((row) => (
            <Stack key={row.label} direction="row" spacing={1} alignItems="center">
              {row.icon}
              <Typography variant="body2" color="text.primary">
                {row.label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <StarRoundedIcon
              key={starIndex}
              sx={{
                fontSize: 18,
                color: starIndex < Math.round(rating) ? "warning.main" : "action.disabled",
              }}
            />
          ))}
          <Typography variant="body2" color="text.secondary">
            {rating} ({reviewCount} reviews)
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
            {formatPrice(selectedVariant?.price_inr ?? phone?.price_inr)}
          </Typography>
          <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
            {formatPrice((selectedVariant?.price_inr ?? phone?.price_inr) * 1.08)}
          </Typography>
        </Stack>

        {badges.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {badges.map((badge) => (
              <Chip key={badge} label={badge} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : null}

        <Box
          sx={{
            maxHeight: expanded ? 1200 : 0,
            overflow: "hidden",
            opacity: expanded ? 1 : 0,
            transition: "all 0.3s ease",
            pt: expanded ? 1 : 0,
          }}
        >
          {expanded ? <TechieSpecs phone={phone} /> : null}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0, mt: "auto", alignItems: "center" }}>
        <Button
          type="button"
          variant={inCompare ? "contained" : "outlined"}
          size="small"
          startIcon={<CompareArrowsIcon />}
          onClick={() => (inCompare ? removeFromCompare(phone) : addToCompare(phone))}
          color={inCompare ? "error" : "primary"}
        >
          {inCompare ? "Remove" : "Compare"}
        </Button>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
        {priceUrl ? (
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<OpenInNewRoundedIcon />}
            onClick={() => window.open(priceUrl, "_blank", "noopener,noreferrer")}
          >
            View Price
          </Button>
        ) : null}
        <Button
          type="button"
          variant="contained"
          size="small"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          disabled={!expandableSpecs}
          sx={{ ml: "auto" }}
        >
          {expanded ? "Hide Details" : "View Details"}
        </Button>
      </CardActions>
    </Card>
  );
}

export default PhoneCard;
