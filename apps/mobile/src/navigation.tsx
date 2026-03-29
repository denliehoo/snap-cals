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
  GoalRecommendation,
  MealType,
  WeightEntry,
} from "@snap-cals/shared";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors, useTheme } from "./contexts/theme-context";
import { initPurchases, usePurchasesListener } from "./hooks/use-purchases";
import AiAssistScreen from "./screens/ai-assist";
import DailyViewScreen from "./screens/daily-view";
import EntryFormScreen from "./screens/entry-form";
import ForgotPasswordScreen from "./screens/forgot-password";
import GoalCoachScreen from "./screens/goal-coach";
import GoalsScreen from "./screens/goals";
import LoginScreen from "./screens/login";
import PaywallScreen from "./screens/paywall";
import QuickAddScreen from "./screens/quick-add";
import ResetPasswordScreen from "./screens/reset-password";
import SettingsScreen from "./screens/settings";
import SignupScreen from "./screens/signup";
import VerifyEmailScreen from "./screens/verify-email";
import WeeklyViewScreen from "./screens/weekly-view";
import WeightHistoryScreen from "./screens/weight-history";
import WeightLogScreen from "./screens/weight-log";
import { useAuthStore } from "./stores/auth.store";
import { useSettingsStore } from "./stores/settings.store";
import { useUsageStore } from "./stores/usage.store";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { userId: string };
  ForgotPassword: { email?: string };
  ResetPassword: { email: string };
};

export type MainTabParamList = {
  DailyTab: { date?: string } | undefined;
  WeeklyTab: undefined;
  WeightTab: undefined;
  SettingsTab: undefined;
};

export type EntryFormPrefill = AiEstimateResponse & { mealType?: MealType };

export type MainStackParamList = {
  MainTabs: undefined;
  EntryForm: { entry?: FoodEntry; prefill?: EntryFormPrefill } | undefined;
  AiAssist: undefined;
  QuickAdd: undefined;
  Goals: { prefill?: GoalRecommendation } | undefined;
  GoalCoach: undefined;
  Paywall: undefined;
  WeightLog: { entry?: WeightEntry } | undefined;
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
            WeightTab: "scale-outline",
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
        name="WeightTab"
        component={WeightHistoryScreen}
        options={{
          title: "Weight",
          tabBarLabel: "Weight",
          headerTitle: "Weight History",
        }}
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
  const fetchUsage = useUsageStore((s) => s.fetch);
  const { isDark } = useTheme();
  const colors = useColors();

  useEffect(() => {
    initPurchases();
    restore();
    restoreSettings();
  }, [restore, restoreSettings]);

  usePurchasesListener();

  useEffect(() => {
    if (token) fetchUsage();
  }, [token, fetchUsage]);

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
          <MainStack.Screen
            name="Goals"
            component={GoalsScreen}
            options={{ title: "Goals", headerBackTitle: "Back" }}
          />
          <MainStack.Screen
            name="GoalCoach"
            component={GoalCoachScreen}
            options={{ title: "AI Goal Coach", headerBackTitle: "Back" }}
          />
          <MainStack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ title: "Upgrade to Pro", headerBackTitle: "Back" }}
          />
          <MainStack.Screen
            name="WeightLog"
            component={WeightLogScreen}
            options={{ title: "Log Weight", headerBackTitle: "Back" }}
          />
        </MainStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
          <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <AuthStack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <AuthStack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
          />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
