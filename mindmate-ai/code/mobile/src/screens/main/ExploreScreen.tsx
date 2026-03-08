import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

interface ResourceCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  duration?: string;
}

const categories: ResourceCategory[] = [
  { id: '1', title: 'Meditation', icon: '🧘', color: '#6366f1' },
  { id: '2', title: 'Breathing', icon: '🫁', color: '#10b981' },
  { id: '3', title: 'Sleep', icon: '😴', color: '#8b5cf6' },
  { id: '4', title: 'Anxiety', icon: '😌', color: '#f59e0b' },
  { id: '5', title: 'Stress', icon: '😮‍💨', color: '#ec4899' },
  { id: '6', title: 'Focus', icon: '🎯', color: '#3b82f6' },
];

const featuredResources: Resource[] = [
  {
    id: '1',
    title: 'Morning Meditation',
    description: 'Start your day with calm and clarity',
    category: 'Meditation',
    duration: '10 min',
  },
  {
    id: '2',
    title: 'Deep Breathing Exercise',
    description: 'Reduce stress with guided breathing',
    category: 'Breathing',
    duration: '5 min',
  },
  {
    id: '3',
    title: 'Sleep Story',
    description: 'Drift off to peaceful sleep',
    category: 'Sleep',
    duration: '20 min',
  },
];

const articles: Resource[] = [
  {
    id: '4',
    title: 'Understanding Anxiety',
    description: 'Learn about the causes and management of anxiety',
    category: 'Anxiety',
  },
  {
    id: '5',
    title: 'Building Healthy Habits',
    description: 'Tips for creating lasting positive changes',
    category: 'Wellness',
  },
  {
    id: '6',
    title: 'The Power of Gratitude',
    description: 'How practicing gratitude improves mental health',
    category: 'Mindfulness',
  },
];

export const ExploreScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Discover resources for your wellness journey
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search resources..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? category.color
                        : colors.card,
                  },
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryTitle,
                    {
                      color:
                        selectedCategory === category.id
                          ? '#fff'
                          : colors.text,
                    },
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featuredResources.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={[styles.featuredCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.featuredContent}>
                  <Text style={[styles.featuredCategory, { color: colors.primary }]}
                  >
                    {resource.category}
                  </Text>
                  <Text style={[styles.featuredTitle, { color: colors.text }]}>
                    {resource.title}
                  </Text>
                  <Text
                    style={[styles.featuredDescription, { color: colors.textSecondary }]
                    }
                  >
                    {resource.description}
                  </Text>
                  {resource.duration && (
                    <Text style={[styles.featuredDuration, { color: colors.textMuted }]}>
                      ⏱️ {resource.duration}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Articles */}
        <View style={styles.articlesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Articles</Text>
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={[styles.articleCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.articleContent}>
                <Text style={[styles.articleCategory, { color: colors.primary }]}>
                  {article.category}
                </Text>
                <Text style={[styles.articleTitle, { color: colors.text }]}>
                  {article.title}
                </Text>
                <Text style={[styles.articleDescription, { color: colors.textSecondary }]}>
                  {article.description}
                </Text>
              </View>
              <Text style={styles.articleArrow}>→</Text>
            </TouchableOpacity>
          ))}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  categoriesSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  categoriesScroll: {
    paddingRight: SPACING.lg,
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuredSection: {
    marginBottom: SPACING.lg,
  },
  featuredScroll: {
    paddingRight: SPACING.lg,
  },
  featuredCard: {
    width: 280,
    borderRadius: 16,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  featuredContent: {
    padding: SPACING.lg,
  },
  featuredCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  featuredDescription: {
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  featuredDuration: {
    fontSize: 12,
  },
  articlesSection: {
    marginBottom: SPACING.lg,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  articleContent: {
    flex: 1,
  },
  articleCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 14,
  },
  articleArrow: {
    fontSize: 20,
    marginLeft: SPACING.sm,
  },
});
