import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * The judge-facing web demo is opened from PC browsers as often as phones.
 * Every screen assumes a phone-width column, so on web it's rendered inside
 * a bounded, centered frame instead of stretching full width; on a narrow
 * (phone) browser viewport the frame's max size never kicks in, so it still
 * renders edge-to-edge there.
 */
export function WebAppFrame({ children }: PropsWithChildren) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.viewport}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20242C',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    maxHeight: 932,
    overflow: 'hidden',
  },
});
