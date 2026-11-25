import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import XIcon from "@mui/icons-material/X";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Divider, Grid, IconButton, Link, Stack, Typography } from "@mui/material";

function Footer() {
  return (
    <Box component="footer" sx={{ mt: 6, borderTop: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={1.25}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Gadget
                <Box component="span" sx={{ color: "primary.main" }}>
                  Guru
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 420 }}>
                Precision-first gadget discovery for shoppers who want clean comparisons, confident recommendations, and less noise.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Stack spacing={1}>
              <Typography variant="caption">Explore</Typography>
              <Link component={RouterLink} to="/" underline="hover" color="text.secondary">Home</Link>
              <Link component={RouterLink} to="/recommend" underline="hover" color="text.secondary">Recommendations</Link>
              <Link component={RouterLink} to="/about" underline="hover" color="text.secondary">About</Link>
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <Stack spacing={1}>
              <Typography variant="caption">Follow</Typography>
              <Stack direction="row" spacing={1}>
                <IconButton aria-label="GitHub">
                  <GitHubIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="LinkedIn">
                  <LinkedInIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="X">
                  <XIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} GadgetGuru. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
