import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#e4b600",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "rgb(37, 6, 6)",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "rgb(254, 248, 248)",
        },
        tabBarActiveTintColor: "#000000",
        tabBarStyle: {
          backgroundColor: "#e4b600",
          borderTopWidth: 1,
          borderTopColor: "#000000",
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 30 : 80,
          paddingTop: 10,
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
      <Tabs.Screen
        name="musica"
        options={{
          title: "TITULO MUSICA",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />        
       
    </Tabs>
  );
}
