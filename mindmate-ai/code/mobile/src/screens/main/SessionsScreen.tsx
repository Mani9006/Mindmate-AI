import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, Session } from '@types';
import { useSessionStore } from '@stores/sessionStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type SessionsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const SessionsScreen: React.FC = () => {
  const navigation = useNavigation<SessionsScreenNavigationProp>();
  const { sessions, fetchSessions, isLoading } = useSessionStore();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const navigateToSession = (sessionId?: string) => {
    navigation.navigate('Session', { sessionId });
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const sessionDate = new Date(item.startedAt);
    const isToday = new Date().toDateString() === sessionDate.toDateString();

    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.card }]}
        onPress={() => navigateToSession(item.id)}
      >
        <View style={styles.sessionIcon}>
          <Text style={styles.sessionIconText}>
            {item.type === 'chat' ? '💬' : item.type === 'voice' ? '🎙️' : '📹'}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionType, { color: colors.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Session
          </Text>
          <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
            {isToday
              ? `Today, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : sessionDate.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </Text>
          {item.duration && (
            <Text style={[styles.sessionDuration, { color: colors.textMuted }]}>
              {Math.floor(item.duration / 60)} min
            </Text>
          )}
        </View>
        <View style={styles.sessionStatus}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'completed'
                    ? colors.success + '20'
                    : item.status === 'active'
                    ? colors.primary + '20'
                    : colors.error + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'completed'
                      ? colors.success
                      : item.status === 'active'
                      ? colors.primary
                      : colors.error,
                },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateEmoji, { color: colors.text }]}>📝</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Sessions Yet</Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        Start your first session to begin tracking your wellness journey.
      </Text>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.primary }]}
        onPress={() => navigateToSession()}
      >
        <Text style={styles.startButtonText}>Start New Session</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sessions</Text>
        <TouchableOpacity
          style={[styles.newSessionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigateToSession()}
        >
          <Text style={styles.newSessionButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newSessionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  newSessionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sessionIconText: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
  },
  sessionStatus: {
    marginLeft: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  startButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
