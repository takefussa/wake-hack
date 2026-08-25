import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/common/loading-screen';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.indigo,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.separator,
    notification: colors.warm,
  },
};

export default function RootLayout() {
  const isHydrated = useAppStore((state) => state.isHydrated);

  return (
    <SafeAreaProvider>
      {isHydrated ? (
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="onboarding/profile" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="morning" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="wake" options={{ animation: 'fade' }} />
            <Stack.Screen name="friend" options={{ animation: 'slide_from_right' }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      ) : (
        <LoadingScreen />
      )}
    </SafeAreaProvider>
  );
}
