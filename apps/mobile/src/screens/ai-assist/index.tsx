import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight } from "../../theme";
import { useColors } from "../../contexts/theme-context";

export default function AiAssistScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>AI Assist — coming in Task 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
