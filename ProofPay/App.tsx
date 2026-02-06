import React from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "./src/context/AppContext";
import AuthScreen from "./src/screens/AuthScreen";
import CreateInvoiceScreen from "./src/screens/CreateInvoiceScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import AccountScreen from "./src/screens/AccountScreen";
import { colors } from "./src/theme/colors";

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { session, loading } = useApp();
  const DebugScreen = __DEV__ ? require("./src/screens/DebugScreen").default : null;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.textPrimary },
          tabBarStyle: { backgroundColor: colors.surface },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen name="Create" component={CreateInvoiceScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
        {__DEV__ && DebugScreen ? (
          <Tab.Screen name="Debug" component={DebugScreen} />
        ) : null}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
  },
});
