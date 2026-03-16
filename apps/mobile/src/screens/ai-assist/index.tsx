import React, { useMemo } from "react";
import { View, TextInput, Text, ActivityIndicator, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight, borderRadius } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import Button from "../../components/button";
import { useAiAssist } from "./use-ai-assist";

export default function AiAssistScreen() {
  const colors = useColors();
  const { description, setDescription, loading, error, estimate } = useAiAssist();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder='e.g. "grande oat milk latte" or "2 eggs on toast"'
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        autoFocus
        editable={!loading}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={loading ? "" : "Estimate"}
        onPress={estimate}
        disabled={!description.trim() || loading}
      />
      {loading && <ActivityIndicator style={styles.spinner} color={colors.primary} />}
      <Text style={styles.disclaimer}>AI estimates may not be exact — review before saving</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.sm },
    spinner: { marginTop: spacing.md },
    disclaimer: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.lg },
  });
