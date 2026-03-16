import React from "react";
import { render, RenderOptions, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "@/contexts/theme-context";
import { SnackbarProvider } from "@/components/snackbar";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SnackbarProvider>{children}</SnackbarProvider>
    </ThemeProvider>
  );
}

async function customRender(ui: React.ReactElement, options?: RenderOptions) {
  const result = render(ui, { wrapper: Providers, ...options });
  await waitFor(() => {});
  return result;
}

export * from "@testing-library/react-native";
export { customRender as render };
