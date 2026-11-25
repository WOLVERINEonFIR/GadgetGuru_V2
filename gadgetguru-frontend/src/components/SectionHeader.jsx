import { Box, Chip, Stack, Typography } from "@mui/material";

function SectionHeader({ title, subtitle, badge }) {
  return (
    <Stack component="header" spacing={1.2} sx={{ mb: 4 }}>
      {badge ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip label={badge} color="primary" size="small" sx={{ alignSelf: "flex-start" }} />
          <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
        </Stack>
      ) : null}
      <Typography variant="h2">{title}</Typography>
      {subtitle ? <Typography variant="body1" color="text.secondary">{subtitle}</Typography> : null}
    </Stack>
  );
}

export default SectionHeader;
