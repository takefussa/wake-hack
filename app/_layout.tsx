import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { colors } from '@/constants/theme';

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
  return (
    <SafeAreaProvider>
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
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
