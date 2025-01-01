import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CursoLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'document' : 'document-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="newTask"
        options={{
          title: 'Nueva Tarea',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'add' : 'add-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asistencias"
        options={{
          title: 'Asistencia',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'clipboard' : 'clipboard-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
