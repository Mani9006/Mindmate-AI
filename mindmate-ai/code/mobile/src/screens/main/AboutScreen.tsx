import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useTheme } from '@hooks/useTheme';
import { APP_CONFIG, SPACING } from '@constants';

type AboutScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'About'>;

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation<AboutScreenNavigationProp>();
  const { colors, isDark } = useTheme();

  const handleOpenWebsite = () => {
    Linking.openURL(APP_CONFIG.WEBSITE_URL);
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>🧠</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>{APP_CONFIG.NAME}</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Version {APP_CONFIG.VERSION}
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            MindMate AI is your personal AI companion for mental wellness. We provide 24/7 support,
            mood tracking, and personalized insights to help you on your wellness journey.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Mission</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.missionText, { color: colors.textSecondary }]}>
              To make mental wellness support accessible to everyone, everywhere. We believe that
              everyone deserves access to tools and resources that help them understand and improve
              their mental well-being.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {[
              { icon: '💬', title: 'AI-Powered Sessions', description: 'Chat, voice, and video sessions with our AI companion' },
              { icon: '📊', title: 'Mood Tracking', description: 'Track your mood and see patterns over time' },
              { icon: '🔒', title: 'Private & Secure', description: 'End-to-end encryption for all conversations' },
              { icon: '📚', title: 'Wellness Resources', description: 'Access guided meditations, articles, and exercises' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connect With Us</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite}>
              <Text style={styles.linkIcon}>🌐</Text>
              <Text style={[styles.linkText, { color: colors.text }]}>Website</Text>
              <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.linkItem} onPress={handleContactSupport}>
              <Text style={styles.linkIcon}>✉️</Text>
              <Text style={[styles.linkText, { color: colors.text }]}>Contact Support</Text>
              <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textMuted }]}>
          © 2024 MindMate AI. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  backButton: {
    fontSize: 24,
    padding: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  missionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
  },
  linkArrow: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
