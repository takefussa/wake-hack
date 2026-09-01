import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { legacyColors as colors, layout, spacing } from '@/constants/theme';

type MorningScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function MorningScreen({ children, contentStyle, testID }: MorningScreenProps) {
  return (
    <LinearGradient
      colors={[colors.morningSky, colors.morningLight, colors.morningBlush]}
      locations={[0, 0.5, 1]}
      style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          bounces
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, contentStyle]} testID={testID}>
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    minHeight: '100%',
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
