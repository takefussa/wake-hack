import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/theme';

type ScreenVariant = 'light' | 'dark';

type ScreenProps = PropsWithChildren<{
  variant?: ScreenVariant;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function Screen({
  children,
  variant = 'light',
  scroll = true,
  contentStyle,
  testID,
}: ScreenProps) {
  const backgroundColor = variant === 'dark' ? colors.navy : colors.background;
  const content = (
    <View style={[styles.content, contentStyle]} testID={testID}>
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      bounces
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {body}
      </SafeAreaView>
    </View>
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
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
