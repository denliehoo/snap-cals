import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "./stores/auth.store";
import { colors } from "./theme";
import { FoodEntry } from "@snap-cals/shared";
import LoginScreen from "./screens/login";
import SignupScreen from "./screens/signup";
import DailyViewScreen from "./screens/daily-view";
import EntryFormScreen from "./screens/entry-form";
import GoalsScreen from "./screens/goals";
import WeeklyViewScreen from "./screens/weekly-view";
import SettingsScreen from "./screens/settings";

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

export type MainStackParamList = {
  MainTabs: undefined;
  EntryForm: { entry?: FoodEntry } | undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            DailyTab: "today-outline",
            WeeklyTab: "bar-chart-outline",
            GoalsTab: "flag-outline",
            SettingsTab: "menu-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DailyTab"
        component={DailyViewScreen}
        options={{ title: "Daily", tabBarLabel: "Daily", headerTitle: "Snap Cals" }}
      />
      <Tab.Screen
        name="WeeklyTab"
        component={WeeklyViewScreen}
        options={{ title: "Weekly", tabBarLabel: "Weekly", headerTitle: "Weekly View" }}
      />
      <Tab.Screen
        name="GoalsTab"
        component={GoalsScreen}
        options={{ title: "Goals", tabBarLabel: "Goals", headerTitle: "Goals" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "More", tabBarLabel: "More", headerTitle: "Settings" }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { token, isLoading, restore } = useAuthStore();

  useEffect(() => {
    restore();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? (
        <MainStack.Navigator>
          <MainStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <MainStack.Screen name="EntryForm" component={EntryFormScreen} options={{ title: "" }} />
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
