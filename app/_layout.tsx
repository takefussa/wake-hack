import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthErrorScreen } from '@/components/auth/auth-error-screen';
import { LoadingScreen } from '@/components/common/loading-screen';
import { colors, fontFamilyName, paperColors } from '@/constants/theme';
import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap';
import { useAppStore } from '@/store/use-app-store';

void SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded, fontError] = useFonts({
    [fontFamilyName]: require('../assets/fonts/851tegaki_zatsu_normal_0883.ttf'),
  });
  const isHydrated = useAppStore((state) => state.isHydrated);
  const { failure, retry, status: authStatus } = useAuthBootstrap();
  const isFontReady = fontsLoaded || fontError !== null;
  const isReady = isHydrated && authStatus === 'ready';

  useEffect(() => {
    if (isFontReady) {
      void SplashScreen.hideAsync();
    }
  }, [isFontReady]);

  if (!isFontReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {isReady ? (
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
          <StatusBar backgroundColor={paperColors.statusGray} style="dark" />
        </ThemeProvider>
      ) : authStatus === 'error' ? (
        <AuthErrorScreen failure={failure} onRetry={retry} />
      ) : (
        <LoadingScreen />
      )}
    </SafeAreaProvider>
  );
}
