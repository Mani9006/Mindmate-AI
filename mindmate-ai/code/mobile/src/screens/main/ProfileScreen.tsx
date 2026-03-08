import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useAuthStore } from '@stores/authStore';
import { useUserStore } from '@stores/userStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  screen: keyof MainStackParamList;
  badge?: number;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const { profile, stats } = useUserStore();
  const { unreadCount } = useNotificationStore();
  const { colors, isDark } = useTheme();

  const menuItems: MenuItem[] = [
    { id: '1', title: 'Edit Profile', icon: '👤', screen: 'EditProfile' },
    { id: '2', title: 'Notifications', icon: '🔔', screen: 'Notifications', badge: unreadCount },
    { id: '3', title: 'Subscription', icon: '💎', screen: 'Subscription' },
    { id: '4', title: 'Session History', icon: '📋', screen: 'SessionHistory' },
    { id: '5', title: 'Mood Tracker', icon: '📊', screen: 'MoodTracker' },
    { id: '6', title: 'Settings', icon: '⚙️', screen: 'Settings' },
    { id: '7', title: 'Help & Support', icon: '❓', screen: 'Help' },
    { id: '8', title: 'About', icon: 'ℹ️', screen: 'About' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const navigateToScreen = (screen: keyof MainStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editAvatarText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

          {/* Quick Stats */}
          <View style={[styles.quickStats, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.totalSessions || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.streakDays || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {profile?.subscription?.plan === 'premium' ? 'Pro' : 'Free'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Plan</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { backgroundColor: colors.card },
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => navigateToScreen(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editAvatarText: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  quickStats: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: SPACING.md,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: 1,
  },
  menuItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuArrow: {
    fontSize: 18,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
  },
});
