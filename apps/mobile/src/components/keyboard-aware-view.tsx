import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
  keyboardVerticalOffset?: number;
}

export default function KeyboardAwareView({
  style,
  edges,
  keyboardVerticalOffset = 0,
  children,
}: PropsWithChildren<Props>) {
  const { backgroundColor, ...contentStyle } = (style as ViewStyle) ?? {};

  return (
    <SafeAreaView
      style={[styles.flex, backgroundColor ? { backgroundColor } : undefined]}
      edges={edges}
    >
      <KeyboardAvoidingView
        style={[styles.flex, contentStyle]}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
