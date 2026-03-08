import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useTheme } from '@hooks/useTheme';
import { APP_CONFIG, SPACING } from '@constants';

type HelpScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Help'>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I start a session?',
    answer:
      'To start a session, go to the Home tab and tap on one of the session types: Chat, Voice, or Video. You can also start a session from the Sessions tab.',
  },
  {
    id: '2',
    question: 'Is my data private?',
    answer:
      'Yes, your privacy is our top priority. All conversations are encrypted and stored securely. We never share your personal information with third parties.',
  },
  {
    id: '3',
    question: 'Can I cancel my subscription?',
    answer:
      'Yes, you can cancel your subscription at any time from the Subscription screen in your profile. Your access will continue until the end of your billing period.',
  },
  {
    id: '4',
    question: 'How does the mood tracker work?',
    answer:
      'The mood tracker allows you to log your mood daily. Simply select how you\'re feeling and optionally add a note. Over time, you\'ll see patterns in your emotional well-being.',
  },
  {
    id: '5',
    question: 'What should I do in a crisis?',
    answer:
      'MindMate AI is not a substitute for professional mental health care in emergencies. If you\'re in crisis, please contact emergency services or a crisis helpline immediately.',
  },
];

export const HelpScreen: React.FC = () => {
  const navigation = useNavigation<HelpScreenNavigationProp>();
  const { colors, isDark } = useTheme();

  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  const handleVisitWebsite = () => {
    Linking.openURL(APP_CONFIG.WEBSITE_URL);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search FAQs..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.secondary }]}
            onPress={handleVisitWebsite}
          >
            <Text style={styles.contactIcon}>🌐</Text>
            <Text style={styles.contactButtonText}>Visit Website</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

        {filteredFAQs.map((faq) => (
          <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.faqQuestion} onPress={() => toggleFAQ(faq.id)}>
              <Text style={[styles.faqQuestionText, { color: colors.text }]}>
                {faq.question}
              </Text>
              <Text
                style={[
                  styles.faqArrow,
                  { color: colors.textMuted },
                  expandedFAQ === faq.id && styles.faqArrowExpanded,
                ]}
              >
                ▼
              </Text>
            </TouchableOpacity>
            {expandedFAQ === faq.id && (
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                {faq.answer}
              </Text>
            )}
          </View>
        ))}

        {filteredFAQs.length === 0 && (
          <View style={styles.noResults}>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        )}
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
  contactSection: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  faqCard: {
    borderRadius: 12,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: SPACING.sm,
  },
  faqArrow: {
    fontSize: 12,
  },
  faqArrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    fontSize: 14,
    lineHeight: 20,
  },
  noResults: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
});
