import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { onboardingPages } from '@/data/onboarding-pages';
import { useTapLock } from '@/hooks/use-tap-lock';

export default function OnboardingScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const page = onboardingPages[pageIndex];
  const isLastPage = pageIndex === onboardingPages.length - 1;
  const runOnce = useTapLock();

  function handleNext() {
    runOnce(() => {
      if (isLastPage) {
        router.push('/onboarding/profile');
        return;
      }

      setPageIndex((current) => current + 1);
    });
  }

  function handleBack() {
    runOnce(() => {
      setPageIndex((current) => Math.max(0, current - 1));
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View pointerEvents="none" style={styles.paperLines}>
        {Array.from({ length: 30 }, (_, index) => (
          <View key={index} style={styles.paperLine} />
        ))}
      </View>

      <View pointerEvents="none" style={styles.marginLine} />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}>
        {pageIndex > 0 && (
          <Pressable
            accessibilityLabel="前のページに戻る"
            hitSlop={12}
            onPress={handleBack}
            testID="onboarding-back"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}>
            <Ionicons name="chevron-back" size={18} color="#30463E" />
            <AppText style={styles.backButtonText}>戻る</AppText>
          </Pressable>
        )}

        <OnboardingScene scene={page.scene} />

        {page.title && page.description && (
          <View style={[styles.copy, page.scene === 'receive' && styles.receiveCopy]}>
            <View style={styles.marker} />
            <AppText style={styles.title}>{page.title}</AppText>
            <AppText style={styles.description}>{page.description}</AppText>
          </View>
        )}

        <View style={styles.footer}>
          <View
            accessibilityLabel={`全${onboardingPages.length}ページ中${pageIndex + 1}ページ`}
            style={styles.dots}>
            {onboardingPages.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  index === 0 && styles.dotBlue,
                  index === 1 && styles.dotPink,
                  index === 2 && styles.dotYellow,
                  index === pageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            testID="onboarding-next"
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}>
            <AppText style={styles.nextButtonText}>
              {isLastPage ? 'はじめる' : '次へ'}
            </AppText>

            <Ionicons name="arrow-forward" size={22} color="#30463E" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F0DE',
  },

  paperLines: {
    ...StyleSheet.absoluteFillObject,
    top: 42,
  },

  paperLine: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 135, 144, 0.15)',
  },

  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 43,
    width: 1,
    backgroundColor: 'rgba(198, 95, 76, 0.28)',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 20,
  },



  copy: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  receiveCopy: {
    marginTop: 30,
  },

  marker: {
    position: 'absolute',
    top: 22,
    left: 10,
    right: 10,
    height: 14,
    backgroundColor: 'rgba(244, 210, 91, 0.42)',
    transform: [{ rotate: '-1deg' }],
  },

  title: {
    color: '#30463E',
    fontSize: 27,
    lineHeight: 37,
    textAlign: 'center',
    zIndex: 1,
  },

  description: {
    marginTop: 22,
    color: '#4D5A53',
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'center',
  },

  footer: {
    marginTop: 'auto',
    gap: 24,
  },

  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 18,
  },

  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    opacity: 0.5,
  },

  dotBlue: {
    backgroundColor: '#89B5CC',
    borderColor: '#567C91',
  },

  dotPink: {
    backgroundColor: '#F2B5AA',
    borderColor: '#B96F61',
  },

  dotYellow: {
    backgroundColor: '#F1D77A',
    borderColor: '#C49A42',
  },

  dotActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },

  backButton: {
    position: 'absolute',
    top: 23,
    left: 0,
    zIndex: 2,
    minHeight: 32,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  backButtonPressed: {
    opacity: 0.55,
  },

  backButtonText: {
    color: '#30463E',
    fontSize: 13,
  },

  nextButton: {
    minHeight: 58,
    marginHorizontal: 34,
    paddingHorizontal: 26,
    backgroundColor: '#9EC6DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 111, 130, 0.55)',
    transform: [{ rotate: '-0.5deg' }],
  },

  nextButtonPressed: {
    opacity: 0.82,
    transform: [
      { rotate: '-0.5deg' },
      { translateY: 1 },
    ],
  },

  nextButtonText: {
    color: '#30463E',
    fontSize: 18,
    letterSpacing: 2,
  },
});
