/**
 * LaptopCard.jsx
 *
 * Mirrors PhoneCard.jsx exactly — same prop interface, same field access patterns,
 * same badge/hero-spec/score-label pattern.
 *
 * Props:
 *   laptop           — enriched laptop object from rankLaptops()
 *   index            — position in list (for staggered animation delay)
 *   showSpecsByDefault — expand specs on mount
 *   expandableSpecs  — whether the expand button is shown
 *   selectedPriority — intent string: gaming|coding|productivity|portability|multimedia|basic
 */

import { useMemo, useState } from "react";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
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
import {
  getLaptopHeroSpec,
  getLaptopScoreLabel,
  normalizeLaptopIntent,
} from "../lib/laptopRecommendationEngine";
import { getGadgetPriceUrl } from "../lib/gadgetData";
import LaptopTechieSpecs from "./LaptopTechieSpecs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPrice(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Price unavailable";
  return `₹${parsed.toLocaleString("en-IN")}`;
}

function formatStorage(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "N/A";
  if (parsed >= 1024 && parsed % 1024 === 0) return `${parsed / 1024}TB`;
  return `${parsed}GB`;
}

function buildLaptopBadges(laptop, intent) {
  const badges = [];
  if (intent === "gaming"      && toNumber(laptop?.scores?.gaming, 0)       >= 80) badges.push("Elite Gaming");
  if (intent === "portability" && toNumber(laptop?.scores?.portability, 0)  >= 80) badges.push("Ultra Portable");
  if (laptop?.isWorthTheJump)  badges.push("Worth the Jump");
  if (laptop?.physical?.form_factor === "ultrabook")                               badges.push("Ultrabook");
  if (laptop?.memory?.ssd_gen === "Gen5")                                          badges.push("PCIe Gen5 SSD");
  if (["DDR5","LPDDR5","LPDDR5X"].includes(laptop?.memory?.ram_gen))               badges.push("DDR5 RAM");
  if (laptop?.performance?.has_dedicated_gpu && intent !== "gaming")               badges.push("Dedicated GPU");
  return badges;
}

// ─── Component ────────────────────────────────────────────────────────────────

function LaptopCard({
  laptop,
  index            = 0,
  showSpecsByDefault = false,
  expandableSpecs  = true,
  selectedPriority = "basic",
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(showSpecsByDefault);
  const [saved, setSaved] = useState(false);

  const intent          = normalizeLaptopIntent(selectedPriority);
  const selectedVariant = laptop?.selectedVariant ?? laptop?.selected_variant ?? laptop?.variants?.[0] ?? null;
  const priceUrl        = getGadgetPriceUrl(laptop);
  const badges          = useMemo(() => buildLaptopBadges(laptop, intent), [laptop, intent]);

  const heroSpec   = getLaptopHeroSpec(laptop, intent);
  const scoreLabel = getLaptopScoreLabel(laptop, intent);

  // RAM / storage from selected variant, with fallback to top-level
  const ramGb     = toNumber(selectedVariant?.ram_gb     ?? laptop?.ram_gb,     0);
  const storageGb = toNumber(selectedVariant?.storage_gb ?? laptop?.storage_gb, 0);
  const price     = toNumber(selectedVariant?.price_inr  ?? laptop?.price_inr,  0);
  const rating = Math.min(5, Math.max(3.9, Number((toNumber(laptop?.scores?.productivity ?? laptop?.scores?.gaming, 82) / 20).toFixed(1))));
  const image = laptop?.image_url || laptop?.image || "/laptop-placeholder.png";
  const name = laptop?.model_name || laptop?.name || "Unknown Model";
  const reviewCount = Math.max(36, Math.round(toNumber(laptop?.review_count ?? laptop?.scores?.coding, 64)));
  const specRows = [
    {
      icon: <MemoryRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: ramGb > 0 ? `${ramGb} GB RAM` : "Config varies",
    },
    {
      icon: <StorageRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: formatStorage(storageGb),
    },
    {
      icon: <SpeedRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: heroSpec,
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
            background: "linear-gradient(180deg, rgba(15,23,42,0.02) 35%, rgba(15,23,42,0.72) 100%)",
          }}
        />
        <Tooltip title={saved ? "Saved" : "Save"} arrow>
          <IconButton
            aria-label={saved ? "Remove bookmark" : "Save gadget"}
            onClick={() => setSaved((previous) => !previous)}
            sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(255,255,255,0.9)" }}
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
          <Chip label={laptop?.brand || "Unknown Brand"} variant="outlined" size="small" color="secondary" />
          <Typography variant="caption" color="text.secondary">
            {scoreLabel}
          </Typography>
        </Stack>

        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
          {laptop?.brand || "Unknown Brand"}
        </Typography>

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

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {ramGb > 0 ? `${ramGb}GB RAM` : "-"} / {formatStorage(storageGb)}
          {laptop?.memory?.ram_gen ? ` · ${laptop.memory.ram_gen}` : ""}
        </Typography>

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
            {formatPrice(price)}
          </Typography>
          <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
            {formatPrice(price * 1.06)}
          </Typography>
        </Stack>

        {badges.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.7}>
            {badges.map((badge) => (
              <Chip
                key={badge}
                label={badge}
                size="small"
                color={badge === "Worth the Jump" ? "success" : badge === "Elite Gaming" ? "secondary" : "default"}
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        <Box sx={{ maxHeight: expanded ? 1800 : 0, overflow: "hidden", opacity: expanded ? 1 : 0, transition: "all 0.3s ease", pt: expanded ? 1 : 0 }}>
          {expanded ? <LaptopTechieSpecs laptop={laptop} /> : null}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0, mt: "auto" }}>
        <Button type="button" variant="outlined" size="small">
          Compare
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
          onClick={() => setExpanded((prev) => !prev)}
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

export default LaptopCard;
