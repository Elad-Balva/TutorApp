import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import "./index.css";
import App from "./App";

const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "dark",
    background: {
      default: "#111317",
      paper: "#1e2024",
    },
    primary: {
      main: "#1493ff",
      light: "#a3c9ff",
      contrastText: "#002a51",
    },
    secondary: {
      main: "#9ffb00",
      contrastText: "#1f3700",
    },
    error: {
      main: "#ffb4ab",
      contrastText: "#690005",
    },
    text: {
      primary: "#e2e2e8",
      secondary: "#c0c7d5",
      disabled: "rgba(224, 226, 232, 0.38)",
    },
    divider: "rgba(255,255,255,0.05)",
    action: {
      active: "#a3c9ff",
      hover: "rgba(163, 201, 255, 0.08)",
      selected: "rgba(20, 147, 255, 0.15)",
      disabled: "rgba(224, 226, 232, 0.38)",
      disabledBackground: "rgba(224, 226, 232, 0.12)",
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#111317",
          color: "#e2e2e8",
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        disableScrollLock: true,
      },
      styleOverrides: {
        paper: {
          backgroundColor: "#1e2024",
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 20,
          touchAction: "manipulation",
        },
        root: {
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.6)",
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Manrope", sans-serif',
          fontWeight: 800,
          color: "#e2e2e8",
          padding: "24px 24px 8px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
        },
      },
    },
    MuiModal: {
      defaultProps: {
        disableEnforceFocus: true,
      },
      styleOverrides: {
        root: {
          WebkitTapHighlightColor: "transparent",
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        ModalProps: {
          disableScrollLock: true,
          keepMounted: false,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#0c0e12",
            borderRadius: 12,
            "& fieldset": {
              borderColor: "#404753",
            },
            "&:hover fieldset": {
              borderColor: "#8a919f",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1493ff",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#c0c7d5",
          },
          "& .MuiInputBase-input": {
            color: "#e2e2e8",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontFamily: '"Manrope", sans-serif',
          fontWeight: 700,
        },
        contained: {
          background: "linear-gradient(135deg, #a3c9ff, #1493ff)",
          color: "#002a51",
          boxShadow: "0 4px 15px rgb(20, 147, 255, 0.15)",
          "&:hover": {
            boxShadow: "0 8px 30px rgb(20, 147, 255, 0.25)",
          },
        },
        outlined: {
          borderColor: "#404753",
          color: "#c0c7d5",
          "&:hover": {
            borderColor: "#a3c9ff",
            color: "#a3c9ff",
            backgroundColor: "rgba(163, 201, 255, 0.08)",
          },
        },
        text: {
          color: "#c0c7d5",
          "&:hover": {
            color: "#e2e2e8",
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: '"Inter", sans-serif',
          fontSize: "0.75rem",
          fontWeight: 500,
        },
        outlined: {
          borderColor: "#404753",
          color: "#c0c7d5",
        },
        colorPrimary: {
          backgroundColor: "rgba(163, 201, 255, 0.12)",
          color: "#a3c9ff",
          border: "1px solid rgba(163, 201, 255, 0.2)",
        },
        colorWarning: {
          backgroundColor: "rgba(255, 200, 0, 0.12)",
          color: "#ffc400",
          border: "1px solid rgba(255, 200, 0, 0.2)",
        },
        colorError: {
          backgroundColor: "rgba(255, 180, 171, 0.12)",
          color: "#ffb4ab",
          border: "1px solid rgba(255, 180, 171, 0.2)",
        },
        colorSuccess: {
          backgroundColor: "rgba(159, 251, 0, 0.12)",
          color: "#9ffb00",
          border: "1px solid rgba(159, 251, 0, 0.2)",
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "#0c0e12",
          borderRadius: 12,
          padding: 4,
          border: "1px solid #404753",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "none",
          color: "#8a919f",
          fontFamily: '"Manrope", sans-serif',
          fontWeight: 600,
          textTransform: "none",
          "&.Mui-selected": {
            backgroundColor: "#1e2024",
            color: "#a3c9ff",
            "&:hover": {
              backgroundColor: "#282a2e",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #a3c9ff, #1493ff)",
          color: "#002a51",
          boxShadow: "0 8px 30px rgb(20, 147, 255, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #b8d4ff, #1ea8ff)",
            boxShadow: "0 12px 40px rgb(20, 147, 255, 0.4)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardError: {
          backgroundColor: "rgba(147, 0, 10, 0.2)",
          border: "1px solid rgba(255, 180, 171, 0.2)",
          color: "#ffb4ab",
        },
        standardInfo: {
          backgroundColor: "rgba(20, 147, 255, 0.1)",
          border: "1px solid rgba(163, 201, 255, 0.2)",
          color: "#a3c9ff",
        },
      },
    },
    MuiCollapse: {
      styleOverrides: {
        root: {
          transition: "height 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>
);
