import { useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, componentSizes, fonts, radii, spacing } from '@/constants/theme';

const visibleRows = 5;
const itemHeight = componentSizes.timeWheelItem;
const wheelHeight = visibleRows * itemHeight;
const wheelPadding = ((visibleRows - 1) / 2) * itemHeight;

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

type WheelColumnProps = {
  accessibilityLabel: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
};

function WheelColumn({ accessibilityLabel, items, value, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const initialOffset = useRef(Math.max(0, items.indexOf(value)) * itemHeight).current;

  useEffect(() => {
    const index = items.indexOf(value);
    if (index < 0) return;

    scrollRef.current?.scrollTo({ y: index * itemHeight, animated: true });
  }, [items, value]);

  function selectFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / itemHeight))
    );
    onChange(items[index]);
  }

  function selectFromDragEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!event.nativeEvent.velocity?.y) {
      selectFromScroll(event);
    }
  }

  function selectFromTap(item: string, index: number) {
    onChange(item);
    scrollRef.current?.scrollTo({ y: index * itemHeight, animated: true });
  }

  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      bounces={false}
      contentOffset={{ x: 0, y: initialOffset }}
      contentContainerStyle={styles.wheelContent}
      decelerationRate="fast"
      onMomentumScrollEnd={selectFromScroll}
      onScrollEndDrag={selectFromDragEnd}
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={itemHeight}
      style={styles.wheel}>
      {items.map((item, index) => {
        const selected = item === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={item}
            onPress={() => selectFromTap(item, index)}
            style={styles.wheelItem}>
            <AppText
              variant="displayNumber"
              tone={selected ? 'dark' : 'muted'}
              style={styles.wheelNumber}>
              {item}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type TimeWheelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TimeWheel({ value, onChange }: TimeWheelProps) {
  const [hour = '07', minute = '00'] = value.split(':');

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.selection} />
      <WheelColumn
        accessibilityLabel="時"
        items={hours}
        onChange={(nextHour) => onChange(`${nextHour}:${minute}`)}
        value={hour}
      />
      <View pointerEvents="none" style={styles.colon}>
        <AppText variant="displayNumber" style={styles.colonText}>
          :
        </AppText>
      </View>
      <WheelColumn
        accessibilityLabel="分"
        items={minutes}
        onChange={(nextMinute) => onChange(`${hour}:${nextMinute}`)}
        value={minute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: wheelHeight,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selection: {
    position: 'absolute',
    top: wheelPadding,
    left: spacing.xl,
    right: spacing.xl,
    height: itemHeight,
    borderRadius: radii.input,
    backgroundColor: colors.indigoSoft,
  },
  wheel: {
    width: 84,
    height: wheelHeight,
    flexGrow: 0,
  },
  wheelContent: {
    paddingVertical: wheelPadding,
  },
  wheelItem: {
    height: itemHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelNumber: {
    fontFamily: fonts?.rounded,
    fontSize: 28,
    lineHeight: 34,
  },
  colon: {
    width: 28,
    height: itemHeight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  colonText: {
    fontFamily: fonts?.rounded,
    fontSize: 28,
    lineHeight: 34,
  },
});
