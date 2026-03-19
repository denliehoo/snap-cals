import {
  type RenderOptions,
  render,
  waitFor,
} from "@testing-library/react-native";
import type React from "react";
import { SnackbarProvider } from "@/components/snackbar";
import { ThemeProvider } from "@/contexts/theme-context";

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
