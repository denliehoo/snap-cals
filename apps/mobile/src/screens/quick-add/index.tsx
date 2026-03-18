import React, { useMemo } from "react";
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, fontSize, fontWeight, borderRadius, shadow } from "@/theme";
import { useColors } from "@/contexts/theme-context";
import { useSnackbar } from "@/components/snackbar";
import { useQuickAdd } from "./use-quick-add";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList, EntryFormPrefill } from "@/navigation";
import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";

type Props = NativeStackScreenProps<MainStackParamList, "QuickAdd">;
type QuickAddItem = FavoriteFoodItem | RecentFoodItem;

export default function QuickAddScreen({ navigation }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const { favorites, recents, loading } = useQuickAdd((msg) => show(msg, "error"));
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sections = [
    { title: "Favorites", data: favorites, emptyText: "No favorites yet" },
    { title: "Recents", data: recents, emptyText: "No recent foods" },
  ].filter((s) => s.data.length > 0 || true); // always show sections

  const handlePress = (item: QuickAddItem) => {
    const { name, calories, protein, carbs, fat, servingSize, mealType } = item;
    const prefill: EntryFormPrefill = { name, calories, protein, carbs, fat, servingSize, mealType };
    navigation.navigate("EntryForm", { prefill });
  };

  const renderItem = ({ item }: { item: QuickAddItem }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={() => handlePress(item)} activeOpacity={0.7}>
      <View style={styles.top}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.cals, { color: colors.calorieColor }]}>{item.calories} kcal</Text>
      </View>
      <View style={styles.macroRow}>
        <Text style={[styles.macro, { color: colors.proteinColor }]}>P {item.protein}g</Text>
        <Text style={[styles.macro, { color: colors.carbsColor }]}>C {item.carbs}g</Text>
        <Text style={[styles.macro, { color: colors.fatColor }]}>F {item.fat}g</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => ("id" in item ? (item as FavoriteFoodItem).id : `${item.name}-${index}`)}
        renderItem={({ item, section }) => section.data.length > 0 ? renderItem({ item }) : null}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name={section.title === "Favorites" ? "heart-outline" : "time-outline"} size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{section.emptyText}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: "center", alignItems: "center" },
    listContent: { paddingBottom: spacing.xl },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    card: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginVertical: spacing.xs,
      ...shadow.sm,
    },
    top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, flex: 1, marginRight: spacing.sm },
    cals: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
    macroRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
    macro: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
    emptySection: { alignItems: "center", paddingVertical: spacing.lg },
    emptyText: { fontSize: fontSize.sm, marginTop: spacing.sm },
  });
