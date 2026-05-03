interface AlertButton {
  text: string;
  style?: "cancel" | "destructive" | "default";
  onPress?: () => void;
}

export function showAlert(
  _title: string,
  message: string,
  buttons: AlertButton[],
) {
  const confirm = buttons.find((b) => b.style !== "cancel");
  const ok = window.confirm(message);
  if (ok) confirm?.onPress?.();
}
