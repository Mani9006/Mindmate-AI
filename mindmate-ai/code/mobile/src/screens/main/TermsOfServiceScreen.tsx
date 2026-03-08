import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type TermsOfServiceScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'TermsOfService'
>;

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<TermsOfServiceScreenNavigationProp>();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: January 2024
        </Text>

        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Section title="Acceptance of Terms" colors={colors}>
            <Paragraph colors={colors}>
              By accessing or using MindMate AI ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </Paragraph>
          </Section>

          <Section title="Description of Service" colors={colors}>
            <Paragraph colors={colors}>
              MindMate AI is an AI-powered mental wellness platform that provides chat, voice, and
              video sessions, mood tracking, and wellness resources. The Service is intended for
              general wellness purposes and is not a substitute for professional mental health care.
            </Paragraph>
          </Section>

          <Section title="User Accounts" colors={colors}>
            <Paragraph colors={colors}>
              To use certain features of the Service, you must create an account. You agree to:
            </Paragraph>
            <BulletPoint colors={colors}>Provide accurate and complete information</BulletPoint>
            <BulletPoint colors={colors}>Maintain the security of your account credentials</BulletPoint>
            <BulletPoint colors={colors}>Promptly notify us of any unauthorized use</BulletPoint>
            <BulletPoint colors={colors}>Accept responsibility for all activities under your account</BulletPoint>
          </Section>

          <Section title="Acceptable Use" colors={colors}>
            <Paragraph colors={colors}>You agree not to:</Paragraph>
            <BulletPoint colors={colors}>Use the Service for any illegal purpose</BulletPoint>
            <BulletPoint colors={colors}>Attempt to gain unauthorized access to the Service</BulletPoint>
            <BulletPoint colors={colors}>Interfere with or disrupt the Service</BulletPoint>
            <BulletPoint colors={colors}>Share your account credentials with others</BulletPoint>
            <BulletPoint colors={colors}>Use the Service to harass or harm others</BulletPoint>
          </Section>

          <Section title="Medical Disclaimer" colors={colors}>
            <Paragraph colors={colors}>
              IMPORTANT: MindMate AI is not a medical device and is not intended to diagnose, treat,
              cure, or prevent any disease or mental health condition. The Service is for general
              wellness and educational purposes only.
            </Paragraph>
            <Paragraph colors={colors}>
              If you are experiencing a mental health emergency or crisis, please contact emergency
              services or a crisis helpline immediately. Do not rely solely on the Service in
              emergency situations.
            </Paragraph>
          </Section>

          <Section title="Intellectual Property" colors={colors}>
            <Paragraph colors={colors}>
              All content, features, and functionality of the Service are owned by MindMate AI and
              are protected by international copyright, trademark, and other intellectual property
              laws. You may not reproduce, distribute, or create derivative works without our
              express permission.
            </Paragraph>
          </Section>

          <Section title="Subscription and Payments" colors={colors}>
            <Paragraph colors={colors}>
              Some features of the Service require a paid subscription. By subscribing:
            </Paragraph>
            <BulletPoint colors={colors}>You agree to pay all applicable fees</BulletPoint>
            <BulletPoint colors={colors}>Subscriptions automatically renew unless cancelled</BulletPoint>
            <BulletPoint colors={colors}>Refunds are provided in accordance with our refund policy</BulletPoint>
            <BulletPoint colors={colors}>We may change pricing with advance notice</BulletPoint>
          </Section>

          <Section title="Termination" colors={colors}>
            <Paragraph colors={colors}>
              We reserve the right to terminate or suspend your account at any time for violations
              of these terms or for any other reason. You may also terminate your account at any
              time by contacting us.
            </Paragraph>
          </Section>

          <Section title="Limitation of Liability" colors={colors}>
            <Paragraph colors={colors}>
              To the maximum extent permitted by law, MindMate AI shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Service.
            </Paragraph>
          </Section>

          <Section title="Changes to Terms" colors={colors}>
            <Paragraph colors={colors}>
              We may modify these Terms of Service at any time. We will notify you of significant
              changes by posting the updated terms on this page. Your continued use of the Service
              after changes constitutes acceptance of the new terms.
            </Paragraph>
          </Section>

          <Section title="Governing Law" colors={colors}>
            <Paragraph colors={colors}>
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which MindMate AI is established, without regard to its conflict of
              law provisions.
            </Paragraph>
          </Section>

          <Section title="Contact Information" colors={colors}>
            <Paragraph colors={colors}>
              If you have any questions about these Terms of Service, please contact us at:
            </Paragraph>
            <Paragraph colors={colors} style={styles.contactEmail}>
              legal@mindmate.ai
            </Paragraph>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
};

interface SectionProps {
  title: string;
  colors: any;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, colors, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {children}
  </View>
);

interface ParagraphProps {
  colors: any;
  children: React.ReactNode;
  style?: any;
}

const Paragraph: React.FC<ParagraphProps> = ({ colors, children, style }) => (
  <Text style={[styles.paragraph, { color: colors.textSecondary }, style]}>{children}</Text>
);

interface BulletPointProps {
  colors: any;
  children: React.ReactNode;
}

const BulletPoint: React.FC<BulletPointProps> = ({ colors, children }) => (
  <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• {children}</Text>
);

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
  lastUpdated: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  content: {
    borderRadius: 16,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: SPACING.md,
    marginBottom: 4,
  },
  contactEmail: {
    fontWeight: '600',
  },
});
