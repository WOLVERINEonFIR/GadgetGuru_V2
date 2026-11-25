import { useCallback, useMemo, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, IconButton, Modal, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useCompare } from "../../context/CompareContext";
import { compareDevices } from "../../lib/phoneApi";
import DeviceHeaderCard from "./DeviceHeaderCard";
import ComparisonTable from "./ComparisonTable";

const SPEC_SECTIONS = [
  { key: "display", label: "Display" },
  { key: "performance", label: "Performance" },
  { key: "battery", label: "Battery" },
  { key: "camera", label: "Camera" },
  { key: "build", label: "Build" },
  { key: "connectivity", label: "Connectivity" },
  { key: "memory", label: "Memory" },
  { key: "software", label: "Software" },
];

function CompareModal() {
  const { compareList, isModalOpen, closeCompareModal, selectedIntent } = useCompare();
  const [isLoading, setIsLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [error, setError] = useState(null);

  const deviceIds = useMemo(() => compareList.map((d) => d._id ?? d.id ?? d.model_name ?? d.model ?? d.name), [compareList]);

  const fetchCompareData = useCallback(async () => {
    if (deviceIds.length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await compareDevices(deviceIds, selectedIntent);
      setCompareResult(result);
    } catch (err) {
      setError(err.message || "Failed to fetch comparison data");
      setCompareResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [deviceIds, selectedIntent]);

  const handleOpen = useCallback(() => {
    fetchCompareData();
  }, [fetchCompareData]);

  const handleClose = useCallback(() => {
    setCompareResult(null);
    setError(null);
    closeCompareModal();
  }, [closeCompareModal]);

  const deviceColumns = compareList.slice(0, 3);

  const getHighlightForDevice = useCallback(
    (deviceId) => {
      if (!compareResult?.ranked_devices) return {};
      const ranked = compareResult.ranked_devices.find((d) => d.device_id === deviceId);
      return ranked?.highlights ?? {};
    },
    [compareResult]
  );

  const getRankForDevice = useCallback(
    (deviceId) => {
      if (!compareResult?.ranked_devices) return null;
      const ranked = compareResult.ranked_devices.find((d) => d.device_id === deviceId);
      return ranked?.rank ?? null;
    },
    [compareResult]
  );

  const hasBackendData = compareResult?.ranked_devices != null;
  const sections = SPEC_SECTIONS ?? [];

  return (
    <Modal
      open={isModalOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "100vw", sm: "95vw" },
          height: { xs: "100vh", sm: "90vh" },
          bgcolor: "background.paper",
          borderRadius: { xs: 0, sm: 2 },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          outline: "none",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Compare Devices
          </Typography>
          <IconButton onClick={handleClose} aria-label="Close comparison">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: { xs: 1, sm: 2 },
            pb: 2,
          }}
        >
          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <Typography>Loading comparison data...</Typography>
            </Stack>
          ) : error ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <Typography color="error">{error}</Typography>
            </Stack>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    overflowX: "auto",
                    minWidth: "max-content",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "minmax(120px, 1fr) repeat(3, minmax(180px, 1.5fr))",
                      gap: 1,
                      minWidth: "fit-content",
                    }}
                  >
                    <Box />
                    {deviceColumns.map((device, index) => (
                      <Box key={device._id ?? device.id ?? index}>
                        <DeviceHeaderCard
                          device={device}
                          rank={hasBackendData ? getRankForDevice(device._id ?? device.id) : null}
                        />
                      </Box>
                    ))}

                    {deviceColumns.length > 1 &&
                      deviceColumns.slice(0, -1).map((_, idx) => (
                        <Box
                          key={`vs-${idx}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              right: 0,
                              top: "50%",
                              height: 1,
                              bgcolor: "divider",
                              zIndex: 0,
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              bgcolor: "background.paper",
                              px: 1,
                              zIndex: 1,
                              color: "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          >
                            VS
                          </Typography>
                        </Box>
                      ))}

                    {sections.map((section) => (
                      <ComparisonTable
                        key={section.key}
                        section={section}
                        devices={deviceColumns}
                        getHighlightForDevice={getHighlightForDevice}
                      />
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </AnimatePresence>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default CompareModal;
