import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Button from "@/components/button";
import FormField from "@/components/form-field";
import { useSnackbar } from "@/components/snackbar";
import UsageLimitModal from "@/components/usage-limit-modal";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList } from "@/navigation";
import { useUsageStore } from "@/stores/usage.store";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";
import { useGoals } from "./use-goals";

export default function GoalsScreen() {
  const colors = useColors();
  const route =
    useRoute<NativeStackScreenProps<MainStackParamList, "Goals">["route"]>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const prefill = route.params?.prefill;
  const {
    calories,
    setCalories,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    loading,
    saving,
    fieldErrors,
    clearFieldError,
    save,
  } = useGoals(prefill);
  const { show } = useSnackbar();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { isAtLimit, resetsAt, fetch: fetchUsage } = useUsageStore();

  useEffect(() => {
    if (prefill) show("AI recommendation applied — review and save");
  }, [prefill, show]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="flag-outline" size={22} color={colors.primary} />
          <Text style={styles.title}>Daily Goals</Text>
        </View>

        <FormField
          label="Calories (kcal)"
          value={calories}
          onChangeText={(v) => {
            setCalories(v);
            clearFieldError("calories");
          }}
          keyboardType="numeric"
          error={fieldErrors.calories}
        />
        <FormField
          label="Protein (g)"
          value={protein}
          onChangeText={(v) => {
            setProtein(v);
            clearFieldError("protein");
          }}
          keyboardType="numeric"
          error={fieldErrors.protein}
        />
        <FormField
          label="Carbs (g)"
          value={carbs}
          onChangeText={(v) => {
            setCarbs(v);
            clearFieldError("carbs");
          }}
          keyboardType="numeric"
          error={fieldErrors.carbs}
        />
        <FormField
          label="Fat (g)"
          value={fat}
          onChangeText={(v) => {
            setFat(v);
            clearFieldError("fat");
          }}
          keyboardType="numeric"
          error={fieldErrors.fat}
        />

        <View style={styles.buttonWrapper}>
          <Button
            title="Save Goals"
            onPress={() =>
              save(
                () => show("Goals saved!"),
                (msg) => show(msg, "error"),
              )
            }
            loading={saving}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Let AI set my goals ✨"
            variant="text"
            onPress={() => {
              if (isAtLimit()) {
                setShowLimitModal(true);
              } else {
                navigation.navigate("GoalCoach");
              }
            }}
          />
        </View>
      </View>
      <UsageLimitModal
        visible={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          fetchUsage();
        }}
        resetsAt={resetsAt}
        onUpgrade={() => navigation.navigate("Paywall")}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.md,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadow.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    buttonWrapper: { marginTop: spacing.sm },
  });
