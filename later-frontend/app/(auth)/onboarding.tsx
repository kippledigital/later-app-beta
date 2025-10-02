import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Colors, Typography, Spacing } from '@/constants/theme';
import { useContextStore } from '@/stores/context';

const CONTENT_TYPES = [
  { id: 'article', label: 'Articles', emoji: '📄' },
  { id: 'video', label: 'Videos', emoji: '🎥' },
  { id: 'podcast', label: 'Podcasts', emoji: '🎧' },
  { id: 'short', label: 'Short Content', emoji: '⚡' },
] as const;

const TOPICS = [
  'Technology', 'Design', 'Business', 'Science', 'Health',
  'Education', 'Entertainment', 'News', 'Sports', 'Travel',
  'Food', 'Arts', 'History', 'Politics', 'Finance',
];

const NOTIFICATION_FREQUENCIES = [
  { id: 'high', label: 'High', description: 'Multiple times per day' },
  { id: 'medium', label: 'Medium', description: 'Once or twice daily' },
  { id: 'low', label: 'Low', description: 'Few times per week' },
  { id: 'off', label: 'Off', description: 'No notifications' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { updatePreferences } = useContextStore();

  const [step, setStep] = useState(1);
  const [contentTypes, setContentTypes] = useState<string[]>(['article']);
  const [topics, setTopics] = useState<string[]>([]);
  const [notificationFrequency, setNotificationFrequency] = useState<'high' | 'medium' | 'low' | 'off'>('medium');
  const [readingSpeed, setReadingSpeed] = useState(250);

  const handleContentTypeToggle = (type: string) => {
    setContentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleTopicToggle = (topic: string) => {
    setTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleFinish = async () => {
    await updatePreferences({
      contentTypes: contentTypes as any[],
      topics,
      notificationFrequency,
      readingSpeed,
    });

    // Navigate to main app
    router.replace('/(tabs)');
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What would you like to save?</Text>
      <Text style={styles.stepSubtitle}>
        Choose the types of content you want to capture and organize
      </Text>

      <View style={styles.optionsGrid}>
        {CONTENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.optionCard,
              contentTypes.includes(type.id) && styles.optionCardSelected
            ]}
            onPress={() => handleContentTypeToggle(type.id)}
          >
            <Text style={styles.optionEmoji}>{type.emoji}</Text>
            <Text style={[
              styles.optionText,
              contentTypes.includes(type.id) && styles.optionTextSelected
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What interests you?</Text>
      <Text style={styles.stepSubtitle}>
        Select topics you'd like to see in your recommendations
      </Text>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topicsGrid}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[
                styles.topicChip,
                topics.includes(topic) && styles.topicChipSelected
              ]}
              onPress={() => handleTopicToggle(topic)}
            >
              <Text style={[
                styles.topicText,
                topics.includes(topic) && styles.topicTextSelected
              ]}>
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How often should we notify you?</Text>
      <Text style={styles.stepSubtitle}>
        We'll suggest content based on your context and availability
      </Text>

      <View style={styles.notificationOptions}>
        {NOTIFICATION_FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.notificationOption,
              notificationFrequency === freq.id && styles.notificationOptionSelected
            ]}
            onPress={() => setNotificationFrequency(freq.id)}
          >
            <View style={styles.notificationContent}>
              <Text style={[
                styles.notificationLabel,
                notificationFrequency === freq.id && styles.notificationLabelSelected
              ]}>
                {freq.label}
              </Text>
              <Text style={[
                styles.notificationDescription,
                notificationFrequency === freq.id && styles.notificationDescriptionSelected
              ]}>
                {freq.description}
              </Text>
            </View>
            <View style={[
              styles.radio,
              notificationFrequency === freq.id && styles.radioSelected
            ]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.progressBar}>
          {[1, 2, 3].map((stepNumber) => (
            <View
              key={stepNumber}
              style={[
                styles.progressSegment,
                step >= stepNumber && styles.progressSegmentActive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>

      <View style={styles.actions}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 1 && contentTypes.length === 0) && styles.nextButtonDisabled
          ]}
          onPress={step === 3 ? handleFinish : () => setStep(step + 1)}
          disabled={step === 1 && contentTypes.length === 0}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 ? 'Get Started' : 'Continue'}
          </Text>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.h2,
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[600],
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.lineHeight.body,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  optionCard: {
    width: '47%',
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.primary[700],
  },
  scrollContent: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  topicChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  topicChipSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  topicText: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[700],
  },
  topicTextSelected: {
    color: 'white',
  },
  notificationOptions: {
    gap: Spacing.md,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  notificationOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  notificationContent: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: Typography.fontSize.body,
    fontWeight: '500',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  notificationLabelSelected: {
    color: Colors.primary[700],
  },
  notificationDescription: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
  },
  notificationDescriptionSelected: {
    color: Colors.primary[600],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
  },
  radioSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[500],
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  backButtonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  nextButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.body,
    color: 'white',
    fontWeight: '600',
  },
});