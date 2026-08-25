import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { HapticTab } from '@/components/common/haptic-tab';
import { colors, componentSizes, fonts } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ color, focused, name }: { color: string; focused: boolean; name: IconName }) {
  return (
    <Ionicons
      color={color}
      name={focused ? name : (`${name}-outline` as IconName)}
      size={componentSizes.tabIcon}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.indigo,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: fonts?.sans,
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0,
        },
        tabBarStyle: {
          borderTopColor: colors.separator,
          backgroundColor: colors.surface,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'つながり',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="people" />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'フレンド',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="heart" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="person" />
          ),
        }}
      />
    </Tabs>
  );
}
