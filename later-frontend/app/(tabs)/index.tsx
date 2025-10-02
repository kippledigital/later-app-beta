import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '@/constants/theme';
import { useContextStore } from '@/stores/context';
import { useContentStore } from '@/stores/content';

const ContextCard = ({ title, icon, content, action }: {
  title: string;
  icon: string;
  content: string;
  action?: () => void;
}) => (
  <TouchableOpacity style={styles.contextCard} onPress={action} disabled={!action}>
    <View style={styles.contextHeader}>
      <Ionicons name={icon as any} size={20} color={Colors.primary[600]} />
      <Text style={styles.contextTitle}>{title}</Text>
    </View>
    <Text style={styles.contextContent}>{content}</Text>
    {action && (
      <Ionicons name="chevron-forward" size={16} color={Colors.neutral[400]} />
    )}
  </TouchableOpacity>
);

const RecommendationCard = ({ title, description, readTime, onPress }: {
  title: string;
  description?: string;
  readTime?: number;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.recommendationCard} onPress={onPress}>
    <Text style={styles.recommendationTitle} numberOfLines={2}>
      {title}
    </Text>
    {description && (
      <Text style={styles.recommendationDescription} numberOfLines={2}>
        {description}
      </Text>
    )}
    <View style={styles.recommendationFooter}>
      {readTime && (
        <Text style={styles.recommendationReadTime}>
          {readTime} min read
        </Text>
      )}
      <Text style={styles.recommendationAction}>Recommended for you</Text>
    </View>
  </TouchableOpacity>
);

export default function DiscoverScreen() {
  const router = useRouter();
  const {
    userContext,
    recommendations,
    isLoadingRecommendations,
    fetchRecommendations,
    updateTimeOfDay,
  } = useContextStore();
  const { inbox } = useContentStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Update time of day when screen loads
    updateTimeOfDay();

    // Fetch recommendations
    fetchRecommendations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRecommendations();
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const { timeOfDay } = userContext;
    switch (timeOfDay) {
      case 'morning': return 'Good morning';
      case 'afternoon': return 'Good afternoon';
      case 'evening': return 'Good evening';
      case 'night': return 'Good night';
      default: return 'Hello';
    }
  };

  const getTimeBasedMessage = () => {
    const { timeOfDay, availableTime } = userContext;

    if (availableTime) {
      return `You have ${availableTime} minutes available`;
    }

    switch (timeOfDay) {
      case 'morning': return 'Start your day with something interesting';
      case 'afternoon': return 'Take a moment to learn something new';
      case 'evening': return 'Wind down with curated content';
      case 'night': return 'End your day with light reading';
      default: return 'Discover content tailored for you';
    }
  };

  const getActivityIcon = () => {
    const { currentActivity } = userContext;
    switch (currentActivity) {
      case 'commuting': return 'car';
      case 'working': return 'briefcase';
      case 'relaxing': return 'leaf';
      case 'exercising': return 'fitness';
      default: return 'person';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.greetingSubtext}>{getTimeBasedMessage()}</Text>
          </View>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => router.push('/capture')}
          >
            <Ionicons name="add" size={24} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Context Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Context</Text>

          <View style={styles.contextGrid}>
            <ContextCard
              title="Available Time"
              icon="time"
              content={userContext.availableTime ? `${userContext.availableTime} minutes` : 'Not set'}
              action={() => {/* TODO: Open time picker */}}
            />

            <ContextCard
              title="Current Activity"
              icon={getActivityIcon()}
              content={userContext.currentActivity || 'Not set'}
              action={() => {/* TODO: Open activity selector */}}
            />

            <ContextCard
              title="Inbox"
              icon="tray"
              content={`${inbox.length} items to organize`}
              action={() => router.push('/inbox')}
            />

            <ContextCard
              title="Battery"
              icon={userContext.deviceContext.isCharging ? 'battery-charging' : 'battery-half'}
              content={`${userContext.deviceContext.battery}%${userContext.deviceContext.isCharging ? ' charging' : ''}`}
            />
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for Now</Text>
            <TouchableOpacity onPress={fetchRecommendations}>
              <Ionicons
                name="refresh"
                size={20}
                color={Colors.primary[600]}
                style={isLoadingRecommendations && styles.spinning}
              />
            </TouchableOpacity>
          </View>

          {recommendations.length > 0 ? (
            <View style={styles.recommendationsGrid}>
              {recommendations.slice(0, 4).map((rec, index) => (
                <RecommendationCard
                  key={index}
                  title={rec.title || 'Recommended Content'}
                  description={rec.description}
                  readTime={rec.estimatedReadTime}
                  onPress={() => {
                    if (rec.id) {
                      router.push(`/content/${rec.id}`);
                    }
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecommendations}>
              <Ionicons name="sparkles-outline" size={48} color={Colors.neutral[400]} />
              <Text style={styles.emptyRecommendationsTitle}>No recommendations yet</Text>
              <Text style={styles.emptyRecommendationsText}>
                Add content to your library to get personalized recommendations
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/capture')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add" size={24} color={Colors.primary[600]} />
              </View>
              <Text style={styles.quickActionTitle}>Capture</Text>
              <Text style={styles.quickActionSubtitle}>Save new content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/inbox')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="tray" size={24} color={Colors.accent[600]} />
              </View>
              <Text style={styles.quickActionTitle}>Organize</Text>
              <Text style={styles.quickActionSubtitle}>Process your inbox</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/library')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="library" size={24} color={Colors.secondary[600]} />
              </View>
              <Text style={styles.quickActionTitle}>Browse</Text>
              <Text style={styles.quickActionSubtitle}>Explore your library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.h2,
    color: Colors.neutral[900],
  },
  greetingSubtext: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  captureButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.h3,
    color: Colors.neutral[900],
    marginBottom: Spacing.lg,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  contextCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contextTitle: {
    fontSize: Typography.fontSize['body-sm'],
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  contextContent: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  recommendationsGrid: {
    gap: Spacing.md,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.body,
  },
  recommendationDescription: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight['body-sm'],
  },
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendationReadTime: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
  },
  recommendationAction: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  emptyRecommendations: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyRecommendationsTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyRecommendationsText: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  spinning: {
    // TODO: Add rotation animation
  },
});
