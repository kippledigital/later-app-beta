import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '@/constants/theme';
import { useContentStore, Content } from '@/stores/content';

const ContentCard = ({ item, onCategorize }: { item: Content; onCategorize: (id: string, status: Content['status']) => void }) => {
  const getContentTypeIcon = (type: Content['contentType']) => {
    switch (type) {
      case 'url': return 'link-outline';
      case 'text': return 'document-text-outline';
      case 'voice': return 'mic-outline';
      case 'image': return 'image-outline';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          <Ionicons
            name={getContentTypeIcon(item.contentType)}
            size={16}
            color={Colors.neutral[500]}
          />
          <Text style={styles.contentTime}>{formatTimeAgo(item.createdAt)}</Text>
          {item.sourceApp && (
            <Text style={styles.sourceApp}>from {item.sourceApp}</Text>
          )}
        </View>
      </View>

      <Text style={styles.contentTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {item.description && (
        <Text style={styles.contentDescription} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      {item.url && (
        <Text style={styles.contentUrl} numberOfLines={1}>
          {item.url}
        </Text>
      )}

      {item.estimatedReadTime && (
        <Text style={styles.readTime}>
          {item.estimatedReadTime} min read
        </Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.readLaterButton]}
          onPress={() => onCategorize(item.id, 'read_later')}
        >
          <Ionicons name="bookmark-outline" size={16} color={Colors.primary[600]} />
          <Text style={[styles.actionButtonText, styles.readLaterText]}>Read Later</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.listenLaterButton]}
          onPress={() => onCategorize(item.id, 'listen_later')}
        >
          <Ionicons name="headset-outline" size={16} color={Colors.secondary[600]} />
          <Text style={[styles.actionButtonText, styles.listenLaterText]}>Listen Later</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.archiveButton]}
          onPress={() => onCategorize(item.id, 'archived')}
        >
          <Ionicons name="archive-outline" size={16} color={Colors.neutral[600]} />
          <Text style={[styles.actionButtonText, styles.archiveText]}>Archive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function InboxScreen() {
  const router = useRouter();
  const { inbox, isLoading, fetchInbox, categorizeContent } = useContentStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInbox();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategorize = async (id: string, status: Content['status']) => {
    try {
      await categorizeContent(id, status);
    } catch (error) {
      console.error('Failed to categorize content:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="tray-outline" size={64} color={Colors.neutral[400]} />
      <Text style={styles.emptyTitle}>Your inbox is empty</Text>
      <Text style={styles.emptyDescription}>
        Captured content will appear here for you to organize
      </Text>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => router.push('/capture')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.captureButtonText}>Capture Content</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Inbox</Text>
          <Text style={styles.subtitle}>
            {inbox.length} {inbox.length === 1 ? 'item' : 'items'} to organize
          </Text>
        </View>

        <TouchableOpacity
          style={styles.captureButtonSmall}
          onPress={() => router.push('/capture')}
        >
          <Ionicons name="add" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={inbox}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard item={item} onCategorize={handleCategorize} />
        )}
        contentContainerStyle={[
          styles.listContent,
          inbox.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.h2,
    color: Colors.neutral[900],
  },
  subtitle: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
    marginTop: 2,
  },
  captureButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  contentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contentTime: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
  },
  sourceApp: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
  },
  contentTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.body,
  },
  contentDescription: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight['body-sm'],
  },
  contentUrl: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary[600],
    marginBottom: Spacing.sm,
  },
  readTime: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '500',
  },
  readLaterButton: {
    backgroundColor: Colors.primary[50],
  },
  readLaterText: {
    color: Colors.primary[600],
  },
  listenLaterButton: {
    backgroundColor: Colors.secondary[50],
  },
  listenLaterText: {
    color: Colors.secondary[600],
  },
  archiveButton: {
    backgroundColor: Colors.neutral[100],
  },
  archiveText: {
    color: Colors.neutral[600],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.h3,
    color: Colors.neutral[700],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.body,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  captureButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
  },
});