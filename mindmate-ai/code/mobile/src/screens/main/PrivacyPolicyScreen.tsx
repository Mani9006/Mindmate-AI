import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@types';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'PrivacyPolicy'
>;

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: January 2024
        </Text>

        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Section title="Introduction" colors={colors}>
            <Paragraph colors={colors}>
              MindMate AI ("we," "our," or "us") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our mobile application.
            </Paragraph>
          </Section>

          <Section title="Information We Collect" colors={colors}>
            <Paragraph colors={colors}>
              We collect information that you provide directly to us, including:
            </Paragraph>
            <BulletPoint colors={colors}>Personal information (name, email, phone number)</BulletPoint>
            <BulletPoint colors={colors}>Account credentials</BulletPoint>
            <BulletPoint colors={colors}>Session content and messages</BulletPoint>
            <BulletPoint colors={colors}>Mood tracking data</BulletPoint>
            <BulletPoint colors={colors}>Device information and usage data</BulletPoint>
          </Section>

          <Section title="How We Use Your Information" colors={colors}>
            <Paragraph colors={colors}>We use the information we collect to:</Paragraph>
            <BulletPoint colors={colors}>Provide and maintain our services</BulletPoint>
            <BulletPoint colors={colors}>Personalize your experience</BulletPoint>
            <BulletPoint colors={colors}>Improve our AI and services</BulletPoint>
            <BulletPoint colors={colors}>Send you notifications and updates</BulletPoint>
            <BulletPoint colors={colors}>Respond to your requests and support needs</BulletPoint>
          </Section>

          <Section title="Data Security" colors={colors}>
            <Paragraph colors={colors}>
              We implement appropriate technical and organizational measures to protect your personal
              information. All conversations are encrypted end-to-end, and we use industry-standard
              security practices to safeguard your data.
            </Paragraph>
          </Section>

          <Section title="Data Retention" colors={colors}>
            <Paragraph colors={colors}>
              We retain your personal information for as long as necessary to provide our services
              and fulfill the purposes outlined in this Privacy Policy. You can request deletion of
              your data at any time by contacting us.
            </Paragraph>
          </Section>

          <Section title="Your Rights" colors={colors}>
            <Paragraph colors={colors}>You have the right to:</Paragraph>
            <BulletPoint colors={colors}>Access your personal information</BulletPoint>
            <BulletPoint colors={colors}>Correct inaccurate information</BulletPoint>
            <BulletPoint colors={colors}>Request deletion of your data</BulletPoint>
            <BulletPoint colors={colors}>Opt-out of certain data processing</BulletPoint>
            <BulletPoint colors={colors}>Export your data</BulletPoint>
          </Section>

          <Section title="Third-Party Services" colors={colors}>
            <Paragraph colors={colors}>
              We may use third-party services to help us operate our application. These services
              have access to your information only to perform specific tasks on our behalf and are
              obligated not to disclose or use it for any other purpose.
            </Paragraph>
          </Section>

          <Section title="Children's Privacy" colors={colors}>
            <Paragraph colors={colors}>
              Our services are not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If you are a parent or guardian
              and believe your child has provided us with personal information, please contact us.
            </Paragraph>
          </Section>

          <Section title="Changes to This Policy" colors={colors}>
            <Paragraph colors={colors}>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </Paragraph>
          </Section>

          <Section title="Contact Us" colors={colors}>
            <Paragraph colors={colors}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Paragraph>
            <Paragraph colors={colors} style={styles.contactEmail}>
              privacy@mindmate.ai
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
