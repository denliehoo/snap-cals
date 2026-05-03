import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";
import { useMemo } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import { useWebRedirect } from "@/hooks/use-web-redirect";
import type { EntryFormPrefill, MainStackParamList } from "@/navigation";
import { fontSize, fontWeight, spacing } from "@/theme";
import { showAlert } from "@/utils/alert";
import QuickAddItem from "./quick-add-item";
import { useQuickAdd } from "./use-quick-add";

type Props = NativeStackScreenProps<MainStackParamList, "QuickAdd">;
type QuickAddItemType = FavoriteFoodItem | RecentFoodItem;

export default function QuickAddScreen({ navigation }: Props) {
  const redirecting = useWebRedirect();
  const colors = useColors();
  const { show } = useSnackbar();
  const { favorites, recents, loading, removeFavorite, addFavorite } =
    useQuickAdd((msg) => show(msg, "error"));
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sections = [
    { title: "Favorites", data: favorites, emptyText: "No favorites yet" },
    { title: "Recents", data: recents, emptyText: "No recent foods" },
  ];

  const handlePress = (item: QuickAddItemType) => {
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

  const handleRemoveFavorite = (item: FavoriteFoodItem) => {
    showAlert("Remove Favorite", `Remove "${item.name}" from favorites?`, [
      { text: "Cancel", style: "cancel" },
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

  const handleAddFavorite = async (item: RecentFoodItem) => {
    try {
      await addFavorite(item);
      show("Added to favorites");
    } catch {
      show("Already in favorites", "error");
    }
  };

  if (redirecting) return null;

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
        renderItem={({ item, section }) => {
          if (section.data.length === 0) return null;
          const isFavorite = section.title === "Favorites";
          return (
            <QuickAddItem
              item={item}
              isFavorite={isFavorite}
              onPress={() => handlePress(item)}
              onFavorite={() => handleAddFavorite(item as RecentFoodItem)}
              onRemove={() => handleRemoveFavorite(item as FavoriteFoodItem)}
            />
          );
        }}
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
    emptySection: { alignItems: "center", paddingVertical: spacing.lg },
    emptyText: { fontSize: fontSize.sm, marginTop: spacing.sm },
  });
