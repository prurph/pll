import React from "react";
import { ThemeProvider } from "theme-ui";
import theme from "@theme-ui/preset-swiss";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
