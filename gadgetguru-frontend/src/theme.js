import { createTheme } from "@mui/material/styles";

const baseThemeOptions = {
  palette: {
    mode: "light",
    primary: { main: "#2563EB", light: "#3B82F6", dark: "#1D4ED8", contrastText: "#FFFFFF" },
    secondary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#64748B", disabled: "#CBD5E1" },
    divider: "rgba(15, 23, 42, 0.08)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: 0, lineHeight: 1.15 },
    h2: { fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: 0 },
    h4: { fontSize: "1.1rem", fontWeight: 600, letterSpacing: 0 },
    h5: { fontSize: "1rem", fontWeight: 600, letterSpacing: 0 },
    h6: { fontSize: "1rem", fontWeight: 600, letterSpacing: 0 },
    body1: { fontSize: "1rem", lineHeight: 1.7 },
    body2: { fontSize: "0.875rem", lineHeight: 1.65, color: "#64748B" },
    caption: { fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: "0.01em", textTransform: "none", fontSize: "0.9rem" },
  },
  shadows: [
    "none",
    "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    "0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -1px rgba(15,23,42,0.04)",
    "0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -2px rgba(15,23,42,0.04)",
    "0 20px 25px -5px rgba(15,23,42,0.10), 0 10px 10px -5px rgba(15,23,42,0.04)",
    ...Array(20).fill("none"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: "smooth",
        },
        body: {
          backgroundColor: "#F8FAFC",
          color: "#0F172A",
        },
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        "*:focus-visible": {
          outline: "2px solid #2563EB",
          outlineOffset: 2,
        },
        "*::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(37, 99, 235, 0.35)",
          borderRadius: 999,
        },
        "*::-webkit-scrollbar-track": {
          backgroundColor: "rgba(148, 163, 184, 0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
            transform: "translateY(-1px)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid rgba(15,23,42,0.07)",
          boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 25px -5px rgba(15,23,42,0.12)",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563EB" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 1.5 },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: "0.78rem" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid rgba(15,23,42,0.07)",
          boxShadow: "none",
          color: "#0F172A",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "8px !important",
          boxShadow: "none",
          "&:before": { display: "none" },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          borderRadius: 999,
          backgroundColor: "#2563EB",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
  },
};

export const premiumTheme = createTheme(baseThemeOptions);

export const classicTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    ...baseThemeOptions.palette,
    primary: { main: "#0F172A", light: "#334155", dark: "#020617", contrastText: "#FFFFFF" },
    secondary: { main: "#475569", light: "#64748B", dark: "#334155" },
  },
});
