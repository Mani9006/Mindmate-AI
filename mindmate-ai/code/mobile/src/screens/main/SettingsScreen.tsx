import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useUserStore } from '@stores/userStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type SettingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { preferences, updatePreferences } = useUserStore();
  const { isEnabled, setEnabled } = useNotificationStore();
  const { colors, isDark } = useTheme();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  const handleNotificationToggle = (value: boolean) => {
    setEnabled(value);
    updatePreferences({ notificationsEnabled: value });
  };

  const handleEmailToggle = (value: boolean) => {
    updatePreferences({ emailNotifications: value });
  };

  const handlePushToggle = (value: boolean) => {
    setEnabled(value);
    updatePreferences({ pushNotifications: value });
  };

  const renderThemeOption = (theme: 'light' | 'dark' | 'system', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor:
            preferences?.theme === theme ? colors.primary + '20' : colors.card,
          borderColor: preferences?.theme === theme ? colors.primary : colors.border,
        },
      ]}
      onPress={() => handleThemeChange(theme)}
    >
      <Text style={styles.themeIcon}>{icon}</Text>
      <Text
        style={[
          styles.themeLabel,
          { color: preferences?.theme === theme ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeOptions}>
              {renderThemeOption('light', 'Light', '☀️')}
              {renderThemeOption('dark', 'Dark', '🌙')}
              {renderThemeOption('system', 'System', '⚙️')}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            NOTIFICATIONS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Enable Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Receive reminders and updates
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.gray300, true: colors.primary }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Receive updates via email
                </Text>
              </View>
              <Switch
                value={preferences?.emailNotifications ?? true}
                onValueChange={handleEmailToggle}
                trackColor={{ false: colors.gray300, true: colors.primary }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Receive push notifications
                </Text>
              </View>
              <Switch
                value={preferences?.pushNotifications ?? true}
                onValueChange={handlePushToggle}
                trackColor={{ false: colors.gray300, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PRIVACY
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>
                Terms of Service
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('About')}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>About MindMate AI</Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <Text style={[styles.menuText, { color: colors.text }]}>Version</Text>
              <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  card: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  menuText: {
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 18,
  },
  versionText: {
    fontSize: 14,
  },
});
