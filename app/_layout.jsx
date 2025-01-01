import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider, GlobalStateProvider } from '@/services/UserContext';
import {AuthProvider} from '@/services/AuthProvider';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActionSheetProvider>
      <AuthProvider>
      <UserProvider>
        <GlobalStateProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }}/>
            <Stack.Screen name="index" options={{ headerShown: false }}/>
            <Stack.Screen name="curso" options={{ headerShown: false }}/>
            <Stack.Screen name="calificaciones" options={{ headerShown: false }}/>
            <Stack.Screen name="reportes" options={{ headerShown: false }}/>
            <Stack.Screen name="+not-found" />
          </Stack>
        </GlobalStateProvider>
      </UserProvider>
      </AuthProvider>
      </ActionSheetProvider>
    </ThemeProvider>
  );
}
