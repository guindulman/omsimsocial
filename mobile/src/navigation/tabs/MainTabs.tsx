import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedStack } from './FeedStack';
import { SearchStack } from './SearchStack';
import { CreateStack } from './CreateStack';
import { NotificationsStack } from './NotificationsStack';
import { ProfileStack } from './ProfileStack';
import { useTheme } from '../../theme/useTheme';
import { buildTabBarStyle } from '../../utils/tabBar';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarStyle = useMemo(() => buildTabBarStyle(theme, insets), [theme, insets]);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily,
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStack}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <LinearGradient
              colors={theme.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.colors.accentGlow,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <Feather name="plus" size={22} color={theme.colors.surface} />
            </LinearGradient>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
