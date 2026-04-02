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
  typography: {
    fontFamily: '"Segoe UI", "Rubik", "Heebo", "Arial Hebrew", sans-serif',
  },
  components: {
    MuiDialog: {
      defaultProps: {
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        disableScrollLock: true,
      },
      styleOverrides: {
        paper: {
          touchAction: "manipulation",
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
