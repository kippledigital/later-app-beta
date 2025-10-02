import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function AuthWelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Later</Text>
          <Text style={styles.subtitle}>
            Capture content when you find it.{'\n'}
            Consume it when you're ready.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🧠</Text>
            <Text style={styles.featureTitle}>Context-Aware</Text>
            <Text style={styles.featureDescription}>
              Smart recommendations based on your time, mood, and activity
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Quick Capture</Text>
            <Text style={styles.featureDescription}>
              Save articles, videos, and notes from anywhere in seconds
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌙</Text>
            <Text style={styles.featureTitle}>Calm Technology</Text>
            <Text style={styles.featureDescription}>
              Respectful of your attention and mental space
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.h1,
    color: Colors.primary[700],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.h4,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.h4,
  },
  features: {
    gap: Spacing.xl,
  },
  feature: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight['body-sm'],
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  secondaryButtonText: {
    color: Colors.neutral[700],
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
  },
});