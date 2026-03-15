import React, { useEffect } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "./stores/auth.store";
import { colors, fontSize } from "./theme";
import { FoodEntry } from "@snap-cals/shared";
import LoginScreen from "./screens/login";
import SignupScreen from "./screens/signup";
import DailyViewScreen from "./screens/daily-view";
import EntryFormScreen from "./screens/entry-form";
import GoalsScreen from "./screens/goals";
import WeeklyViewScreen from "./screens/weekly-view";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  DailyView: undefined;
  WeeklyView: undefined;
  EntryForm: { entry?: FoodEntry } | undefined;
  Goals: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

export default function Navigation() {
  const { token, isLoading, restore, logout } = useAuthStore();

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
          <MainStack.Screen
            name="DailyView"
            component={DailyViewScreen}
            options={({ navigation }) => ({
              title: "Snap Cals",
              headerRight: () => (
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <TouchableOpacity onPress={() => navigation.navigate("WeeklyView")}>
                    <Text style={{ color: colors.primary, fontSize: fontSize.md }}>Weekly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate("Goals")}>
                    <Text style={{ color: colors.primary, fontSize: fontSize.md }}>Goals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={logout}>
                    <Text style={{ color: colors.error, fontSize: fontSize.md }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ),
            })}
          />
          <MainStack.Screen name="EntryForm" component={EntryFormScreen} options={{ title: "" }} />
          <MainStack.Screen name="WeeklyView" component={WeeklyViewScreen} options={{ title: "Weekly View" }} />
          <MainStack.Screen name="Goals" component={GoalsScreen} options={{ title: "Goals" }} />
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
