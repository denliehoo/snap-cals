import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "./src/contexts/theme-context";
import { SnackbarProvider } from "./src/components/snackbar";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SnackbarProvider>
          <Navigation />
        </SnackbarProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
