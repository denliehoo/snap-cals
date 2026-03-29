import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";
import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  type Animated,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { EntryFormPrefill, MainStackParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";
import { useQuickAdd } from "./use-quick-add";

type Props = NativeStackScreenProps<MainStackParamList, "QuickAdd">;
type QuickAddItem = FavoriteFoodItem | RecentFoodItem;

export default function QuickAddScreen({ navigation }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const { favorites, recents, loading, removeFavorite, addFavorite } =
    useQuickAdd((msg) => show(msg, "error"));
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const sections = [
    { title: "Favorites", data: favorites, emptyText: "No favorites yet" },
    { title: "Recents", data: recents, emptyText: "No recent foods" },
  ];

  const handlePress = (item: QuickAddItem) => {
    const { name, calories, protein, carbs, fat, servingSize, mealType } = item;
    const source = "source" in item ? item.source : undefined;
    const prefill: EntryFormPrefill = {
      name,
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      source: source ?? undefined,
      mealType,
    };
    navigation.navigate("EntryForm", { prefill });
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.success }]}>
      <Ionicons name="heart" size={24} color={colors.textOnPrimary} />
    </View>
  );

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View
      style={[
        styles.swipeAction,
        styles.swipeRight,
        { backgroundColor: colors.error },
      ]}
    >
      <Ionicons name="trash" size={24} color={colors.textOnPrimary} />
    </View>
  );

  const closeSwipeable = (key: string) => {
    swipeableRefs.current.get(key)?.close();
  };

  const handleSwipeLeft = (item: FavoriteFoodItem, key: string) => {
    Alert.alert("Remove Favorite", `Remove "${item.name}" from favorites?`, [
      { text: "Cancel", style: "cancel", onPress: () => closeSwipeable(key) },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeFavorite(item.id);
          show("Removed from favorites");
        },
      },
    ]);
  };

  const handleSwipeRight = async (item: RecentFoodItem, key: string) => {
    try {
      await addFavorite(item);
      show("Added to favorites");
    } catch {
      show("Already in favorites", "error");
    }
    closeSwipeable(key);
  };

  const renderItem = ({
    item,
    section,
    index,
  }: {
    item: QuickAddItem;
    section: { title: string };
    index: number;
  }) => {
    const key =
      "id" in item ? (item as FavoriteFoodItem).id : `${item.name}-${index}`;
    const isFavorite = section.title === "Favorites";

    const card = (
      <RectButton
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.top}>
          <View style={styles.nameCol}>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.name}
            </Text>
            {"source" in item && item.source ? (
              <Text style={[styles.source, { color: colors.textSecondary }]}>
                {item.source}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.cals, { color: colors.calorieColor }]}>
            {item.calories} kcal
          </Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={[styles.macro, { color: colors.proteinColor }]}>
            P {item.protein}g
          </Text>
          <Text style={[styles.macro, { color: colors.carbsColor }]}>
            C {item.carbs}g
          </Text>
          <Text style={[styles.macro, { color: colors.fatColor }]}>
            F {item.fat}g
          </Text>
        </View>
      </RectButton>
    );

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(key, ref);
        }}
        renderLeftActions={isFavorite ? undefined : renderLeftActions}
        renderRightActions={isFavorite ? renderRightActions : undefined}
        onSwipeableOpen={(direction) => {
          if (direction === "left" && !isFavorite)
            handleSwipeRight(item as RecentFoodItem, key);
          if (direction === "right" && isFavorite)
            handleSwipeLeft(item as FavoriteFoodItem, key);
        }}
      >
        {card}
      </Swipeable>
    );
  };

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
        keyExtractor={(item, index) =>
          "id" in item ? (item as FavoriteFoodItem).id : `${item.name}-${index}`
        }
        renderItem={({ item, section, index }) =>
          section.data.length > 0 ? renderItem({ item, section, index }) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons
                name={
                  section.title === "Favorites"
                    ? "heart-outline"
                    : "time-outline"
                }
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {section.emptyText}
              </Text>
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
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    nameCol: {
      flex: 1,
      marginRight: spacing.sm,
    },
    name: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    source: {
      fontSize: fontSize.xs,
      marginTop: 2,
    },
    cals: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
    macroRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
    macro: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
    emptySection: { alignItems: "center", paddingVertical: spacing.lg },
    emptyText: { fontSize: fontSize.sm, marginTop: spacing.sm },
    swipeAction: {
      justifyContent: "center",
      alignItems: "flex-end",
      paddingHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      borderRadius: borderRadius.lg,
    },
    swipeRight: { alignItems: "flex-start" },
  });
