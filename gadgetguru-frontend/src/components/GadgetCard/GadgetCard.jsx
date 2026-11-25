import { memo, useEffect, useMemo, useState } from "react";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import StarIcon from "@mui/icons-material/Star";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { PLACEHOLDER_IMAGE, formatPrice, getGadgetBrand, getGadgetId, getGadgetName, toNumber } from "./gadgetUtils";

const BOOKMARK_KEY = "gadget_bookmarks";

function getSelectedVariant(gadget) {
  return gadget?.selectedVariant ?? gadget?.selected_variant ?? gadget?.variants?.[0] ?? null;
}

function getSpecs(gadget) {
  const variant = getSelectedVariant(gadget);
  const ram = toNumber(variant?.ram_gb ?? gadget?.ram_gb, 0);
  const storage = toNumber(variant?.storage_gb ?? gadget?.storage_gb, 0);
  const battery = toNumber(gadget?.battery?.capacity_mah ?? gadget?.battery_mah, 0);
  const specs = [];
  if (ram > 0) specs.push(`${ram}GB RAM`);
  if (storage > 0) specs.push(storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`);
  if (battery > 0) specs.push(`${battery}mAh`);
  return specs.slice(0, 3);
}

function GadgetCard({ gadget, category = "Phone", compareCount = 0, isCompared = false, onCompare, onDetails }) {
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const id = getGadgetId(gadget);
  const name = getGadgetName(gadget);
  const brand = getGadgetBrand(gadget);
  const selectedVariant = getSelectedVariant(gadget);
  const price = toNumber(selectedVariant?.price_inr ?? gadget?.price_inr ?? gadget?.price?.sale ?? gadget?.price, 0);
  const originalPrice = toNumber(gadget?.original_price_inr ?? gadget?.price?.mrp, 0);
  const rating = Math.min(5, Math.max(3.8, Number((toNumber(gadget?.finalScore ?? gadget?.scores?.overall ?? gadget?.scores?.productivity, 82) / 20).toFixed(1))));
  const reviewCount = Math.max(24, Math.round(toNumber(gadget?.reviews_count ?? gadget?.review_count ?? gadget?.finalScore, 84)));
  const image = gadget?.image_url || gadget?.image || PLACEHOLDER_IMAGE;
  const specs = useMemo(() => getSpecs(gadget), [gadget]);
  const bookmarked = bookmarkedIds.includes(id);
  const compareDisabled = !isCompared && compareCount >= 3;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
        setBookmarkedIds(Array.isArray(stored) ? stored.map(String) : []);
      } catch {
        setBookmarkedIds([]);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleToggleBookmark = () => {
    setBookmarkedIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("gadget-bookmarks-updated"));
      return next;
    });
  };

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
      }}
    >
      {/* === CARD MEDIA === */}
      <Box sx={{ position: "relative" }}>
        <CardMedia component="img" height="180" image={image} alt={name} loading="lazy" sx={{ objectFit: "cover" }} />
        <IconButton
          size="small"
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={handleToggleBookmark}
          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)" }}
        >
          {bookmarked ? <BookmarkIcon color="primary" fontSize="small" /> : <BookmarkBorderIcon color="action" fontSize="small" />}
        </IconButton>
        <Chip
          label={category}
          size="small"
          color={category === "Laptop" ? "secondary" : category === "Accessory" ? "default" : "primary"}
          sx={{ position: "absolute", bottom: 8, left: 8 }}
        />
      </Box>

      {/* === CARD CONTENT === */}
      <CardContent sx={{ px: 2, pt: 1.5, pb: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {brand} {gadget?.model ? `• ${gadget.model}` : ""}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
          {specs.map((spec) => (
            <Chip key={spec} size="small" variant="outlined" label={spec} />
          ))}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
          <StarIcon fontSize="small" color="warning" />
          <Typography variant="body2">{rating}</Typography>
          <Typography variant="caption" color="text.secondary">
            ({reviewCount} reviews)
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
            {formatPrice(price)}
          </Typography>
          {originalPrice > price ? (
            <Typography variant="body2" color="text.disabled" sx={{ textDecoration: "line-through" }}>
              {formatPrice(originalPrice)}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>

      {/* === CARD ACTIONS === */}
      <CardActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button variant="outlined" size="small" fullWidth onClick={() => onDetails(gadget)}>
          Details
        </Button>
        <Tooltip title={compareDisabled ? "Max 3 gadgets" : ""}>
          <span style={{ width: "100%" }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              color={isCompared ? "error" : "primary"}
              disabled={compareDisabled}
              onClick={() => onCompare(gadget)}
            >
              {isCompared ? "Remove" : "Compare"}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

export default memo(GadgetCard);


