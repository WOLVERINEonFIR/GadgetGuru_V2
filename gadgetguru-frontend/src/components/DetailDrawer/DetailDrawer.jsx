import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { PLACEHOLDER_IMAGE, formatPrice, getGadgetName } from "../GadgetCard/gadgetUtils";

function getSelectedVariant(gadget) {
  return gadget?.selectedVariant ?? gadget?.selected_variant ?? gadget?.variants?.[0] ?? null;
}

function detailRows(gadget) {
  const variant = getSelectedVariant(gadget);
  return [
    ["Brand", gadget?.brand ?? gadget?.smartphone_brand ?? "Unknown"],
    ["RAM", variant?.ram_gb || gadget?.ram_gb ? `${variant?.ram_gb ?? gadget?.ram_gb} GB` : "Varies"],
    ["Storage", variant?.storage_gb || gadget?.storage_gb ? `${variant?.storage_gb ?? gadget?.storage_gb} GB` : "Varies"],
    ["Processor", gadget?.performance?.chipset ?? gadget?.processor_name ?? gadget?.cpu ?? "Not listed"],
    ["Battery", gadget?.battery?.capacity_mah ?? gadget?.battery_mah ? `${gadget?.battery?.capacity_mah ?? gadget?.battery_mah} mAh` : "Not listed"],
    ["Display", gadget?.display?.refresh_rate_hz ?? gadget?.refresh_rate_hz ? `${gadget?.display?.refresh_rate_hz ?? gadget?.refresh_rate_hz} Hz` : "Not listed"],
  ];
}

function DetailDrawer({ gadget, open, onClose, onCompare }) {
  const selectedVariant = getSelectedVariant(gadget);
  const image = gadget?.image_url || gadget?.image || PLACEHOLDER_IMAGE;
  const price = selectedVariant?.price_inr ?? gadget?.price_inr ?? gadget?.price?.sale ?? gadget?.price;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 420 },
          maxHeight: "100vh",
          overflowY: "auto",
          boxSizing: "border-box",
          p: 0,
        },
      }}
    >
      {/* === DRAWER HEADER === */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 1, borderBottom: "1px solid", borderColor: "divider", p: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
          {gadget ? getGadgetName(gadget) : "Details"}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close details">
          <CloseIcon />
        </IconButton>
      </Stack>

      {/* === DRAWER BODY === */}
      {gadget ? (
        <Box sx={{ p: 2 }}>
          <Box component="img" src={image} alt={getGadgetName(gadget)} sx={{ width: "100%", borderRadius: 2, objectFit: "cover" }} />
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Grid container spacing={1.5}>
            {detailRows(gadget).map(([label, value]) => (
              <Grid size={{ xs: 6 }} key={label}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {value}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {gadget?.description ?? gadget?.summary ?? "A matching gadget from the current catalog based on your selected preferences."}
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, mt: 2 }}>
            {formatPrice(price)}
          </Typography>
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => onCompare(gadget)}>
            Compare
          </Button>
        </Box>
      ) : null}
    </Drawer>
  );
}

export default DetailDrawer;

