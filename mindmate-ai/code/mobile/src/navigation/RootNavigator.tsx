import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '@types';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTheme } from '@hooks/useTheme';
import { COLORS } from '@constants';

// Navigators
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation theme
const getNavigationTheme = (isDark: boolean) => ({
  dark: isDark,
  colors: {
    primary: COLORS.primary,
    background: isDark ? COLORS.darkBackground : COLORS.white,
    card: isDark ? COLORS.darkSurface : COLORS.white,
    text: isDark ? COLORS.white : COLORS.gray900,
    border: isDark ? COLORS.gray800 : COLORS.gray200,
    notification: COLORS.accent,
  },
});

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { initialize: initializeNotifications } = useNotificationStore();
  const { isDark, colors } = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        await initializeNotifications();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  // Show loading screen while initializing
  if (!isReady || !isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? colors.background : COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={getNavigationTheme(isDark)}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
