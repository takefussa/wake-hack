import { router } from 'expo-router';
import type { Href } from 'expo-router';

export function goBackOrReplace(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
