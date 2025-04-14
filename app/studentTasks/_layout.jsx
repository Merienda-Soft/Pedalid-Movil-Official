import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "../../components/navigation/TabBarIcon";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useLocalSearchParams } from "expo-router";

export default function StudentTasksLayout() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tareas",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "list" : "list-outline"}
              color={color}
            />
          ),
        }}
        initialParams={params}
      />
      <Tabs.Screen
        name="supportContent"
        options={{
          title: "Material de Apoyo",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "document-text" : "document-text-outline"}
              color={color}
            />
          ),
        }}
        initialParams={params}
      />
    </Tabs>
  );
}
