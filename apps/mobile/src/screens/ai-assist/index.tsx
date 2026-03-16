import React, { useMemo } from "react";
import { View, TextInput, Text, Switch, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight, borderRadius } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import Button from "../../components/button";
import { useAiAssist } from "./use-ai-assist";
import { useSettingsStore } from "../../stores/settings.store";

export default function AiAssistScreen() {
  const colors = useColors();
  const { description, setDescription, loading, error, estimate } = useAiAssist();
  const globalDefault = useSettingsStore((s) => s.discussionMode);
  const [discussionMode, setDiscussionMode] = React.useState(globalDefault);
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
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Discussion Mode</Text>
        <Switch
          value={discussionMode}
          onValueChange={setDiscussionMode}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Estimate"
        onPress={estimate}
        disabled={!description.trim()}
        loading={loading}
      />
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
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    toggleLabel: { color: colors.text, fontSize: fontSize.md },
    disclaimer: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.lg },
  });
