import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#000000",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#000000",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "rgb(254, 248, 248)",
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarStyle: {
          display: "none",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "link" : "eye"}
              size={24}
              color={color}
            />
          ),
        }}
      />    
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="rotas/busca/[query]" options={{ href: null }} />
    </Tabs>
  );
}
