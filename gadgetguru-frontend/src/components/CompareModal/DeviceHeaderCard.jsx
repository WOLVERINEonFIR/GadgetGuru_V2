import { Box, Chip, Stack, Typography } from "@mui/material";
import { getGadgetBrand, getGadgetId, getGadgetName, formatPrice } from "../GadgetCard/gadgetUtils";

function getCheapestPrice(device) {
  if (!device) return null;
  
  const directPrice = device.price_inr;
  if (directPrice > 0) return directPrice;

  const variants = device.variants ?? device.selectedVariant ? [device.selectedVariant ?? device.selected_variant].filter(Boolean) : [];
  if (variants.length > 0) {
    const prices = variants.map((v) => Number(v.price_inr)).filter((p) => p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }

  return null;
}

function DeviceHeaderCard({ device, rank }) {
  const id = getGadgetId(device);
  const name = getGadgetName(device);
  const brand = getGadgetBrand(device);
  const image = device.image_url ?? device.image ?? "";
  const cheapestPrice = getCheapestPrice(device);

  return (
    <Stack
      sx={{
        position: "sticky",
        top: 0,
        bgcolor: "background.paper",
        zIndex: 10,
        p: 1,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {rank != null && (
        <Chip
          label={`#${rank}`}
          color={rank === 1 ? "success" : rank === 2 ? "primary" : "default"}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            fontWeight: 700,
            zIndex: 20,
          }}
        />
      )}

      <Box
        sx={{
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "grey.100",
          mb: 1,
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image}
            alt={name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.disabled">
              No Image
            </Typography>
          </Box>
        )}
      </Box>

      <Stack spacing={0.5}>
        <Chip label={brand} size="small" variant="outlined" sx={{ alignSelf: "flex-start", fontSize: "0.7rem" }} />
        
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            display: "-webkit-box",
            overflow: "hidden",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {name}
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
          {cheapestPrice ? formatPrice(cheapestPrice) : "N/A"}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default DeviceHeaderCard;
