import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "./src/contexts/theme-context";
import { SnackbarProvider } from "./src/components/snackbar";
import { useOtaUpdate } from "./src/hooks/use-ota-update";
import Navigation from "./src/navigation";

function AppContent() {
  useOtaUpdate();
  return <Navigation />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SnackbarProvider>
          <AppContent />
        </SnackbarProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
