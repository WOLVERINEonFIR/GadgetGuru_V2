import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useCompare } from "../../context/CompareContext";
import { getGadgetId, getGadgetName } from "../GadgetCard/gadgetUtils";

function CompareBar() {
  const { compareList, clearCompare, openCompareModal, removeFromCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <Paper
      component="aside"
      aria-label="Compare tray"
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: "1px solid",
        borderColor: "divider",
        px: { xs: 1.5, md: 3 },
        py: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
          Compare ({compareList.length}/3)
        </Typography>

        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            overflowX: "auto", 
            flex: 1,
            mx: 1,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {compareList.map((gadget) => {
            const id = getGadgetId(gadget);
            const name = getGadgetName(gadget);
            const image = gadget.image_url ?? gadget.image ?? "";
            
            return (
              <Chip
                key={id}
                label={name}
                onDelete={() => removeFromCompare(gadget)}
                variant="outlined"
                size="small"
                sx={{ 
                  maxWidth: 150,
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }
                }}
                icon={
                  image ? (
                    <Box
                      component="img"
                      src={image}
                      alt=""
                      sx={{
                        width: 24,
                        height: 24,
                        objectFit: "contain",
                        ml: 1,
                      }}
                    />
                  ) : undefined
                }
              />
            );
          })}

          {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, index) => (
            <Box
              key={`empty-${index}`}
              sx={{
                width: 100,
                height: 36,
                border: "1.5px dashed",
                borderColor: "divider",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                Empty slot
              </Typography>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="text" 
            size="small" 
            color="error" 
            onClick={clearCompare}
            aria-label="Clear compare list"
            sx={{ minWidth: "auto" }}
          >
            Clear
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            disabled={compareList.length < 2} 
            onClick={openCompareModal}
            aria-label="Open compare view"
          >
            Compare
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default CompareBar;
