import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  AiEstimateResponse,
  FoodEntry,
  MealType,
} from "@snap-cals/shared";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors, useTheme } from "./contexts/theme-context";
import AiAssistScreen from "./screens/ai-assist";
import DailyViewScreen from "./screens/daily-view";
import EntryFormScreen from "./screens/entry-form";
import GoalsScreen from "./screens/goals";
import LoginScreen from "./screens/login";
import QuickAddScreen from "./screens/quick-add";
import SettingsScreen from "./screens/settings";
import SignupScreen from "./screens/signup";
import WeeklyViewScreen from "./screens/weekly-view";
import { useAuthStore } from "./stores/auth.store";
import { useSettingsStore } from "./stores/settings.store";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  DailyTab: { date?: string } | undefined;
  WeeklyTab: undefined;
  GoalsTab: undefined;
  SettingsTab: undefined;
};

export type EntryFormPrefill = AiEstimateResponse & { mealType?: MealType };

export type MainStackParamList = {
  MainTabs: undefined;
  EntryForm: { entry?: FoodEntry; prefill?: EntryFormPrefill } | undefined;
  AiAssist: undefined;
  QuickAdd: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const colors = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            DailyTab: "today-outline",
            WeeklyTab: "bar-chart-outline",
            GoalsTab: "flag-outline",
            SettingsTab: "menu-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="DailyTab"
        component={DailyViewScreen}
        options={{
          title: "Daily",
          tabBarLabel: "Daily",
          headerTitle: "Snap Cals",
        }}
      />
      <Tab.Screen
        name="WeeklyTab"
        component={WeeklyViewScreen}
        options={{
          title: "Weekly",
          tabBarLabel: "Weekly",
          headerTitle: "Weekly View",
        }}
      />
      <Tab.Screen
        name="GoalsTab"
        component={GoalsScreen}
        options={{ title: "Goals", tabBarLabel: "Goals", headerTitle: "Goals" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "More",
          tabBarLabel: "More",
          headerTitle: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { token, isLoading, restore } = useAuthStore();
  const restoreSettings = useSettingsStore((s) => s.restore);
  const { isDark } = useTheme();
  const colors = useColors();

  useEffect(() => {
    restore();
    restoreSettings();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      {token ? (
        <MainStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        >
          <MainStack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <MainStack.Screen
            name="EntryForm"
            component={EntryFormScreen}
            options={{ title: "", headerBackTitle: "Back" }}
          />
          <MainStack.Screen
            name="AiAssist"
            component={AiAssistScreen}
            options={{ title: "AI Assist", headerBackTitle: "Back" }}
          />
          <MainStack.Screen
            name="QuickAdd"
            component={QuickAddScreen}
            options={{ title: "Quick Add", headerBackTitle: "Back" }}
          />
        </MainStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
