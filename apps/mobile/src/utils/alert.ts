import { Alert } from "react-native";

interface AlertButton {
  text: string;
  style?: "cancel" | "destructive" | "default";
  onPress?: () => void;
}

export function showAlert(
  title: string,
  message: string,
  buttons: AlertButton[],
) {
  Alert.alert(title, message, buttons);
}
