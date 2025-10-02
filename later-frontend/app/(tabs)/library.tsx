import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '@/constants/theme';
import { useContentStore, Content, ContentFilter } from '@/stores/content';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', status: undefined },
  { id: 'read_later', label: 'Read Later', status: 'read_later' as const },
  { id: 'listen_later', label: 'Listen Later', status: 'listen_later' as const },
  { id: 'archived', label: 'Archived', status: 'archived' as const },
];

const CONTENT_TYPE_OPTIONS = [
  { id: 'all', label: 'All Types', type: undefined },
  { id: 'url', label: 'Articles', type: 'url' as const },
  { id: 'video', label: 'Videos', type: 'url' as const },
  { id: 'text', label: 'Notes', type: 'text' as const },
  { id: 'voice', label: 'Voice', type: 'voice' as const },
  { id: 'image', label: 'Images', type: 'image' as const },
];

const LibraryContentCard = ({ item, onPress }: { item: Content; onPress: () => void }) => {
  const getContentTypeIcon = (type: Content['contentType']) => {
    switch (type) {
      case 'url': return 'link-outline';
      case 'text': return 'document-text-outline';
      case 'voice': return 'mic-outline';
      case 'image': return 'image-outline';
    }
  };

  const getStatusColor = (status: Content['status']) => {
    switch (status) {
      case 'read_later': return Colors.primary[600];
      case 'listen_later': return Colors.secondary[600];
      case 'archived': return Colors.neutral[500];
      default: return Colors.neutral[500];
    }
  };

  const getStatusLabel = (status: Content['status']) => {
    switch (status) {
      case 'read_later': return 'Read Later';
      case 'listen_later': return 'Listen Later';
      case 'archived': return 'Archived';
      default: return '';
    }
  };

  return (
    <TouchableOpacity style={styles.libraryCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Ionicons
            name={getContentTypeIcon(item.contentType)}
            size={16}
            color={Colors.neutral[500]}
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        {item.readProgress && item.readProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.readProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(item.readProgress)}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {item.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        {item.estimatedReadTime && (
          <Text style={styles.readTime}>
            {item.estimatedReadTime} min read
          </Text>
        )}
        {item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function LibraryScreen() {
  const router = useRouter();
  const { library, isLoading, searchLibrary, filter, setFilter } = useContentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Initial load
    searchLibrary('', filter);
  }, []);

  useEffect(() => {
    // Search when query or filter changes
    const timeoutId = setTimeout(() => {
      searchLibrary(searchQuery, filter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filter]);

  const handleFilterChange = (newFilter: Partial<ContentFilter>) => {
    setFilter({ ...filter, ...newFilter });
  };

  const handleContentPress = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={64} color={Colors.neutral[400]} />
      <Text style={styles.emptyTitle}>No content found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : 'Organize content from your inbox to build your library'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your library..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.neutral[500]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.neutral[500]} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={20} color={showFilters ? Colors.primary[600] : Colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Status</Text>
                <View style={styles.filterOptions}>
                  {FILTER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterChip,
                        filter.status === option.status && styles.filterChipActive
                      ]}
                      onPress={() => handleFilterChange({ status: option.status })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filter.status === option.status && styles.filterChipTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Type</Text>
                <View style={styles.filterOptions}>
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterChip,
                        filter.contentType === option.type && styles.filterChipActive
                      ]}
                      onPress={() => handleFilterChange({ contentType: option.type })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filter.contentType === option.type && styles.filterChipTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={library}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LibraryContentCard
            item={item}
            onPress={() => handleContentPress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          library.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.h2,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral[900],
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  filtersContainer: {
    marginTop: Spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterGroup: {
    marginRight: Spacing.lg,
  },
  filterGroupTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[700],
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
  },
  libraryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[600],
  },
  cardTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.body,
  },
  cardDescription: {
    fontSize: Typography.fontSize['body-sm'],
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight['body-sm'],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[600],
  },
  moreTagsText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral[500],
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
    lineHeight: Typography.lineHeight.body,
  },
});