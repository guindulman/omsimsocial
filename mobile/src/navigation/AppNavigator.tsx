import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/useTheme';
import { Icon } from '../components/Icon';
import { AppText } from '../components/AppText';
import { IconMark } from '../branding/IconMark';
import { OmsimFab } from '../components/OmsimFab';
import { PulseScreen } from '../screens/PulseScreen';
import { BackstageScreen } from '../screens/BackstageScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { AdoptSheetScreen } from '../screens/AdoptSheetScreen';
import { ConnectHubScreen } from '../screens/ConnectHubScreen';
import { PulseAlertsScreen } from '../screens/PulseAlertsScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { ProfileViewsScreen } from '../screens/ProfileViewsScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { BackstageThreadScreen } from '../screens/BackstageThreadScreen';
import { ChatThreadScreen } from '../screens/ChatThreadScreen';
import { LiveLinkScreen } from '../screens/LiveLinkScreen';
import { LegacyDetailScreen } from '../screens/LegacyDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { RootStackParamList, TabParamList } from './types';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const Tabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + insets.bottom;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingTop: theme.spacing.sm,
            paddingBottom: insets.bottom,
            shadowColor: theme.colors.shadow,
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -6 },
            elevation: 8,
          },
          tabBarBackground: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.surfaceGlassStrong,
                borderTopWidth: 1,
                borderTopColor: theme.colors.glassBorder,
              }}
            />
          ),
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontFamily: theme.typography.fontFamily,
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'Pulse'
                ? 'pulse'
                : route.name === 'Backstage'
                ? 'backstage'
                : route.name === 'Chats'
                ? 'chats'
                : route.name === 'Vault'
                ? 'vault'
                : 'profile';
            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Pulse"
          component={PulseScreen}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <IconMark size={28} />
                <AppText variant="subtitle">Omsim</AppText>
              </View>
            ),
          }}
        />
        <Tab.Screen name="Backstage" component={BackstageScreen} />
        <Tab.Screen name="Chats" component={ChatsScreen} />
        <Tab.Screen name="Vault" component={VaultScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      <OmsimFab
        bottomOffset={tabBarHeight - theme.spacing.md}
        onPress={() => navigation.navigate('ConnectHub')}
        onLongPress={() => navigation.navigate('CreatePost')}
        onSwipeUp={() => navigation.navigate('PulseAlerts')}
      />
    </View>
  );
};

export const AppNavigator = () => {
  const theme = useTheme();

  const navTheme = {
    ...DefaultTheme,
    dark: theme.isDark,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.textPrimary,
      border: theme.colors.borderSubtle,
      primary: theme.colors.accent,
      notification: theme.colors.urgency,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTintColor: theme.colors.textPrimary,
          contentStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Pulse' }} />
        <Stack.Screen name="LegacyDetail" component={LegacyDetailScreen} options={{ title: 'Legacy' }} />
        <Stack.Screen name="LiveLink" component={LiveLinkScreen} options={{ title: 'Live Link' }} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="ProfileViews" component={ProfileViewsScreen} options={{ title: 'Profile Views' }} />
        <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ title: 'Appearance' }} />
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="BackstageThread" component={BackstageThreadScreen} options={{ title: 'Backstage' }} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen
          name="AdoptSheet"
          component={AdoptSheetScreen}
          options={{ presentation: 'transparentModal', headerShown: false }}
        />
        <Stack.Screen
          name="PulseAlerts"
          component={PulseAlertsScreen}
          options={{ presentation: 'transparentModal', headerShown: false }}
        />
        <Stack.Screen
          name="ConnectHub"
          component={ConnectHubScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
