import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  type KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string;
  editable?: boolean;
  onPress?: () => void;
  maxLength?: number;
}

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  error,
  editable = true,
  onPress,
  maxLength,
}: FormFieldProps) {
  const colors = useColors();
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry === true;

  const input = (
    <View>
      <TextInput
        style={[
          styles.input,
          isPassword && styles.inputWithToggle,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={isPassword && hidden}
        autoCapitalize={isPassword ? "none" : undefined}
        autoCorrect={isPassword ? false : undefined}
        editable={editable}
        maxLength={maxLength}
        pointerEvents={onPress ? "none" : "auto"}
      />
      {isPassword && (
        <Pressable
          style={styles.eyeButton}
          onPress={() => setHidden((h) => !h)}
          hitSlop={8}
        >
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {onPress ? <Pressable onPress={onPress}>{input}</Pressable> : input}
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  inputWithToggle: {
    paddingRight: spacing.md + 28,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  error: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
