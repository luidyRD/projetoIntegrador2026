import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import HomeBottomBar from "../components/HomeBottomBar";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#000000" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { color: "#FFFFFF" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="favoritos" options={{ title: "Favoritos" }} />
      </Stack>
      <HomeBottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
});
