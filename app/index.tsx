import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/common/loading-screen';
import { useAppStore } from '@/store/use-app-store';

export default function EntryScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const isHydrated = useAppStore((state) => state.isHydrated);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return <Redirect href={currentUser ? '/(tabs)' : '/onboarding'} />;
}
