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

type SessionHistoryScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'SessionHistory'
>;

export const SessionHistoryScreen: React.FC = () => {
  const navigation = useNavigation<SessionHistoryScreenNavigationProp>();
  const { sessions, fetchSessions, deleteSession, isLoading } = useSessionStore();
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

  const handleDeleteSession = (sessionId: string) => {
    // Show confirmation before deleting
    deleteSession(sessionId);
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const sessionDate = new Date(item.startedAt);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('Session', { sessionId: item.id })}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTypeContainer}>
            <Text style={styles.sessionTypeIcon}>
              {item.type === 'chat' ? '💬' : item.type === 'voice' ? '🎙️' : '📹'}
            </Text>
            <Text style={[styles.sessionType, { color: colors.text }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Session
            </Text>
          </View>
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

        <View style={styles.sessionDetails}>
          <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
            {formattedDate} at {formattedTime}
          </Text>
          {item.duration && (
            <Text style={[styles.sessionDuration, { color: colors.textMuted }]}>
              Duration: {Math.floor(item.duration / 60)} min
            </Text>
          )}
          {item.messages && (
            <Text style={[styles.messageCount, { color: colors.textMuted }]}>
              {item.messages.length} messages
            </Text>
          )}
        </View>

        {item.summary && (
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Summary:
            </Text>
            <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={2}>
              {item.summary}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Session History</Text>
        <View style={styles.placeholder} />
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📋</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Sessions Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Your completed sessions will appear here
            </Text>
          </View>
        }
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
  listContent: {
    padding: SPACING.lg,
  },
  sessionCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTypeIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
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
  sessionDetails: {
    marginBottom: SPACING.sm,
  },
  sessionDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
    marginBottom: 2,
  },
  messageCount: {
    fontSize: 12,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
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
  },
});
