import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "./stores/auth.store";
import { colors } from "./theme";
import { FoodEntry } from "@snap-cals/shared";
import LoginScreen from "./screens/login";
import SignupScreen from "./screens/signup";
import HomeScreen from "./screens/home";
import EntryFormScreen from "./screens/entry-form";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  EntryForm: { entry?: FoodEntry } | undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

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
          <MainStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
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
