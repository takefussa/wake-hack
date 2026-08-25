import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppLogo } from '@/components/common/app-logo';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { colors, spacing } from '@/constants/theme';
import { onboardingPages } from '@/data/onboarding-pages';

export default function OnboardingScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const page = onboardingPages[pageIndex];
  const isLastPage = pageIndex === onboardingPages.length - 1;

  function handleNext() {
    if (isLastPage) {
      router.push('/onboarding/profile');
      return;
    }
    setPageIndex((current) => current + 1);
  }

  return (
    <Screen variant="dark" contentStyle={styles.content} testID="onboarding-screen">
      <StatusBar style="light" />
      <AppLogo compact mode="dark" />

      <OnboardingScene scene={page.scene} />

      <View style={styles.copy}>
        <AppText variant="screenTitle" tone="light">
          {page.title}
        </AppText>
        <AppText variant="secondary" tone="lightMuted">
          {page.description}
        </AppText>
      </View>

      <View style={styles.footer}>
        <View
          accessibilityLabel={`全${onboardingPages.length}ページ中${pageIndex + 1}ページ`}
          style={styles.dots}>
          {onboardingPages.map((item, index) => (
            <View key={item.id} style={[styles.dot, index === pageIndex && styles.dotActive]} />
          ))}
        </View>
        <AppButton
          label={isLastPage ? 'はじめる' : '次へ'}
          icon="arrow-forward"
          onPress={handleNext}
          testID="onboarding-next"
          variant="inverted"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xxl,
  },
  copy: {
    gap: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.navyRaised,
  },
  dotActive: {
    backgroundColor: colors.textInverse,
  },
});
