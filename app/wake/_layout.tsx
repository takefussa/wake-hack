import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function WakeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.morningLight },
      }}
    />
  );
}
