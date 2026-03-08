import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '@types';
import { useAuthStore } from '@stores/authStore';
import { COLORS, STORAGE_KEYS } from '@constants';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Check onboarding status and navigate
    const checkOnboardingAndNavigate = async () => {
      // Wait for auth initialization
      if (!isInitialized) {
        return;
      }

      // Small delay for splash effect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if onboarding is completed
      const onboardingCompleted = await AsyncStorage.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED
      );

      if (isAuthenticated) {
        // User is authenticated, main app will be shown by RootNavigator
        return;
      } else if (onboardingCompleted === 'true') {
        // Onboarding completed, go to login
        navigation.replace('Login');
      } else {
        // First time, go to onboarding
        navigation.replace('Onboarding');
      }
    };

    checkOnboardingAndNavigate();
  }, [isInitialized, isAuthenticated, navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('@assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
