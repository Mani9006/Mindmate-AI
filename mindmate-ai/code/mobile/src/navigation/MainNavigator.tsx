import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList, MainTabParamList } from '@types';
import { useTheme } from '@hooks/useTheme';

// Main Tab Screens
import { HomeScreen } from '@screens/main/HomeScreen';
import { SessionsScreen } from '@screens/main/SessionsScreen';
import { ExploreScreen } from '@screens/main/ExploreScreen';
import { ProfileScreen } from '@screens/main/ProfileScreen';

// Stack Screens
import { SessionScreen } from '@screens/main/SessionScreen';
import { SessionHistoryScreen } from '@screens/main/SessionHistoryScreen';
import { MoodTrackerScreen } from '@screens/main/MoodTrackerScreen';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import { EditProfileScreen } from '@screens/main/EditProfileScreen';
import { SubscriptionScreen } from '@screens/main/SubscriptionScreen';
import { NotificationsScreen } from '@screens/main/NotificationsScreen';
import { HelpScreen } from '@screens/main/HelpScreen';
import { AboutScreen } from '@screens/main/AboutScreen';
import { PrivacyPolicyScreen } from '@screens/main/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '@screens/main/TermsOfServiceScreen';

// Tab Icons Component
import { TabBarIcon } from '@components/common/TabBarIcon';

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator
const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="chatbubbles" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="compass" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Session Screens */}
      <Stack.Screen 
        name="Session" 
        component={SessionScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
      <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} />

      {/* Profile & Settings Screens */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Info Screens */}
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};
