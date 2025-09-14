import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '../../components/navigation/TabBarIcon';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useGlobalState } from '../../services/UserContext';

export default function CursoLayout() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();

  const isManagementClosed = globalState?.management?.status === 0;

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
            <TabBarIcon name={focused ? 'list-circle' : 'list-circle-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="newTask"
        options={{
          title: 'Nueva',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
          ),
          href: isManagementClosed ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="asistencias"
        options={{
          title: 'Asistencia',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="supportMaterial"
        options={{
          title: 'Material',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'folder' : 'folder-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
