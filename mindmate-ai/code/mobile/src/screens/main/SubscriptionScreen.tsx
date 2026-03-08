import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useUserStore } from '@stores/userStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Subscription'
>;

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '5 chat sessions per month',
      'Basic mood tracking',
      'Limited resources',
      'Email support',
    ],
    color: '#6b7280',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited chat sessions',
      'Advanced mood tracking',
      'All resources',
      'Priority support',
      'Session summaries',
    ],
    color: '#6366f1',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    features: [
      'Everything in Basic',
      'Voice & video sessions',
      'Personalized insights',
      '24/7 priority support',
      'Family sharing (up to 4)',
    ],
    isPopular: true,
    color: '#8b5cf6',
  },
];

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const { profile } = useUserStore();
  const { colors, isDark } = useTheme();

  const currentPlan = profile?.subscription?.plan || 'free';

  const handleSubscribe = (planId: string) => {
    // Handle subscription
    console.log('Subscribe to:', planId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Plan */}
        <View style={[styles.currentPlanCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>
            Current Plan
          </Text>
          <Text style={[styles.currentPlanName, { color: colors.text }]}>
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Text>
          {profile?.subscription?.status === 'active' && (
            <Text style={[styles.subscriptionStatus, { color: colors.success }]}>
              ✓ Active
            </Text>
          )}
        </View>

        {/* Plans */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>

        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              { backgroundColor: colors.card },
              plan.isPopular && styles.popularPlanCard,
              currentPlan === plan.id && styles.currentPlanCardActive,
            ]}
          >
            {plan.isPopular && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}

            {currentPlan === plan.id && (
              <View style={[styles.currentBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>
                  /{plan.period}
                </Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: plan.color },
                currentPlan === plan.id && styles.subscribedButton,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={currentPlan === plan.id}
            >
              <Text style={styles.subscribeButtonText}>
                {currentPlan === plan.id ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              Can I cancel anytime?
            </Text>
            <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              What payment methods are accepted?
            </Text>
            <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              Is there a refund policy?
            </Text>
            <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
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
  currentPlanCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  currentPlanLabel: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subscriptionStatus: {
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  planCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  currentPlanCardActive: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    left: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 14,
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  featureCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  featureText: {
    fontSize: 14,
  },
  subscribeButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribedButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    marginTop: SPACING.lg,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  faqQuestion: {
    fontSize: 14,
  },
  faqArrow: {
    fontSize: 18,
  },
});
