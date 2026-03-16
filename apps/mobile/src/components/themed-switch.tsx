import React from "react";
import { Switch, SwitchProps } from "react-native";
import { useColors } from "../contexts/theme-context";

export default function ThemedSwitch(props: SwitchProps) {
  const colors = useColors();
  return (
    <Switch
      trackColor={{ true: colors.primary, false: colors.border }}
      thumbColor={colors.textOnPrimary}
      {...props}
    />
  );
}
