import { ThemeProvider } from "./src/contexts/theme-context";
import { SnackbarProvider } from "./src/components/snackbar";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <Navigation />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
