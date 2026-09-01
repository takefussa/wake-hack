import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotebookWallpaper } from '@/components/common/notebook-wallpaper';
import { layout, paperColors, spacing } from '@/constants/theme';

type MorningScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function MorningScreen({ children, contentStyle, testID }: MorningScreenProps) {
  return (
    <View style={styles.root}>
      <NotebookWallpaper />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: paperColors.base,
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
