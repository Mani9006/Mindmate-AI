import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useAuthStore } from '@stores/authStore';
import { useUserStore } from '@stores/userStore';
import { useSessionStore } from '@stores/sessionStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuthStore();
  const { profile, stats, fetchProfile, fetchStats, isLoading } = useUserStore();
  const { sessions, fetchSessions } = useSessionStore();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchProfile(), fetchStats(), fetchSessions(1, 5)]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToSession = (type: 'chat' | 'voice' | 'video') => {
    navigation.navigate('Session', { type });
  };

  const navigateToMoodTracker = () => {
    navigation.navigate('MoodTracker');
  };

  const navigateToSessionHistory = () => {
    navigation.navigate('SessionHistory');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.firstName || 'Friend'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Start a Session</Text>
          <View style={styles.sessionTypes}>
            <TouchableOpacity
              style={[styles.sessionButton, { backgroundColor: colors.primary }]}
              onPress={() => navigateToSession('chat')}
            >
              <Text style={styles.sessionButtonText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sessionButton, { backgroundColor: colors.secondary }]}
              onPress={() => navigateToSession('voice')}
            >
              <Text style={styles.sessionButtonText}>🎙️ Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sessionButton, { backgroundColor: colors.accent }]}
              onPress={() => navigateToSession('video')}
            >
              <Text style={styles.sessionButtonText}>📹 Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.totalSessions || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sessions
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.totalMinutes || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Minutes
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.streakDays || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Day Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Mood Tracker */}
        <TouchableOpacity
          style={[styles.moodCard, { backgroundColor: colors.card }]}
          onPress={navigateToMoodTracker}
        >
          <View>
            <Text style={[styles.moodTitle, { color: colors.text }]}>How are you feeling?</Text>
            <Text style={[styles.moodSubtitle, { color: colors.textSecondary }]}>
              Track your mood today
            </Text>
          </View>
          <Text style={styles.moodEmoji}>😊</Text>
        </TouchableOpacity>

        {/* Recent Sessions */}
        <View style={styles.recentSessions}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sessions</Text>
            <TouchableOpacity onPress={navigateToSessionHistory}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No sessions yet. Start your first session today!
              </Text>
            </View>
          ) : (
            sessions.slice(0, 3).map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('Session', { sessionId: session.id })}
              >
                <View>
                  <Text style={[styles.sessionType, { color: colors.text }]}>
                    {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {new Date(session.startedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionStatus,
                    {
                      color:
                        session.status === 'completed'
                          ? colors.success
                          : session.status === 'active'
                          ? colors.primary
                          : colors.error,
                    },
                  ]}
                >
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  header: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  quickActions: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  sessionTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionButton: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sessionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: SPACING.lg,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  moodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  moodSubtitle: {
    fontSize: 14,
  },
  moodEmoji: {
    fontSize: 40,
  },
  recentSessions: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
  },
  sessionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
});
