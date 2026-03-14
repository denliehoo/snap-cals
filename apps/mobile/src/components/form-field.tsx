import React from "react";
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../theme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
}

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: FormFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
