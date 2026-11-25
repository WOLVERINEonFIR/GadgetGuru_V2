import { Chip, Paper, Stack, Typography } from "@mui/material";

const placeholderOffers = [
  { title: "Bank discount", description: "Save more with selected card partners.", tag: "Limited" },
  { title: "Exchange bonus", description: "Extra value on eligible old devices.", tag: "Limited" },
  { title: "No-cost EMI", description: "Flexible monthly payment options.", tag: "Limited" },
];

function OffersPanel({ offers = [] }) {
  const visibleOffers = offers.length > 0 ? offers : placeholderOffers;

  return (
    <Paper elevation={0} sx={{ bgcolor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 3, mt: 2, p: 2 }}>
      {/* === OFFERS HEADER === */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Current Offers
      </Typography>

      {/* === OFFERS BODY === */}
      <Stack spacing={1}>
        {visibleOffers.map((offer) => (
          <Paper key={offer.title} elevation={0} sx={{ bgcolor: "action.hover", p: 1.5, borderRadius: 2 }}>
            <Stack spacing={0.75}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {offer.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {offer.description ?? offer.detail}
              </Typography>
              <Chip size="small" label={offer.tag ?? "Limited"} color="warning" variant="outlined" sx={{ alignSelf: "flex-start" }} />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}

export default OffersPanel;
