// E2E tests for content organization workflows
import { TestHelpers } from '../setup';

describe('Content Organization Workflows', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await TestHelpers.login();

    // Seed some test content
    await seedTestContent();
  });

  async function seedTestContent() {
    const testContents = [
      { url: 'https://example.com/tech-article', title: 'Technology Trends 2024' },
      { url: 'https://example.com/productivity-tips', title: 'Productivity Hacks' },
      { url: 'https://example.com/health-guide', title: 'Health and Wellness Guide' },
      { url: 'https://example.com/cooking-recipe', title: 'Quick Dinner Recipes' },
      { url: 'https://example.com/travel-blog', title: 'Travel Photography Tips' },
    ];

    for (const content of testContents) {
      await TestHelpers.captureContent(content.url);
    }
  }

  describe('Inbox Management', () => {
    it('should display newly captured content in inbox', async () => {
      await TestHelpers.navigateToTab('inbox-tab');

      // Should show captured content
      await expect(element(by.text('Technology Trends 2024'))).toBeVisibleOnScreen();
      await expect(element(by.text('Productivity Hacks'))).toBeVisibleOnScreen();
      await expect(element(by.id('inbox-content-list'))).toBeVisibleOnScreen();
    });

    it('should allow triaging content from inbox', async () => {
      await TestHelpers.navigateToTab('inbox-tab');

      // Swipe to reveal triage options
      await element(by.text('Technology Trends 2024')).swipe('left');
      await expect(element(by.id('quick-actions-menu'))).toBeVisibleOnScreen();

      // Mark as read later
      await element(by.id('read-later-button')).tap();
      await expect(element(by.text('Moved to Read Later'))).toBeVisibleOnScreen();

      // Archive an item
      await element(by.text('Productivity Hacks')).swipe('left');
      await element(by.id('archive-button')).tap();
      await expect(element(by.text('Archived'))).toBeVisibleOnScreen();

      // Delete an item
      await element(by.text('Health and Wellness Guide')).swipe('left');
      await element(by.id('delete-button')).tap();
      await expect(element(by.text('Confirm delete'))).toBeVisibleOnScreen();
      await element(by.text('Delete')).tap();
      await expect(element(by.text('Deleted'))).toBeVisibleOnScreen();
    });

    it('should support bulk actions in inbox', async () => {
      await TestHelpers.navigateToTab('inbox-tab');

      // Enter selection mode
      await element(by.id('select-multiple-button')).tap();
      await expect(element(by.id('selection-mode-header'))).toBeVisibleOnScreen();

      // Select multiple items
      await element(by.text('Technology Trends 2024')).tap();
      await element(by.text('Productivity Hacks')).tap();
      await element(by.text('Cooking Recipe')).tap();

      // Should show selection count
      await expect(element(by.text('3 selected'))).toBeVisibleOnScreen();

      // Apply bulk action
      await element(by.id('bulk-archive-button')).tap();
      await expect(element(by.text('3 items archived'))).toBeVisibleOnScreen();

      // Exit selection mode
      await element(by.id('exit-selection-button')).tap();
      await expect(element(by.id('inbox-content-list'))).toBeVisibleOnScreen();
    });

    it('should filter inbox content', async () => {
      await TestHelpers.navigateToTab('inbox-tab');

      // Open filter menu
      await element(by.id('filter-button')).tap();
      await expect(element(by.id('filter-menu'))).toBeVisibleOnScreen();

      // Filter by content type
      await element(by.id('filter-articles')).tap();
      await element(by.id('apply-filter-button')).tap();

      // Should only show article content
      await expect(element(by.text('Technology Trends 2024'))).toBeVisibleOnScreen();
      await expect(element(by.id('filter-active-indicator'))).toBeVisibleOnScreen();

      // Clear filter
      await element(by.id('clear-filter-button')).tap();
      await expect(element(by.text('All content'))).toBeVisibleOnScreen();
    });
  });

  describe('Library Organization', () => {
    it('should display organized content in library', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Should show different organization views
      await expect(element(by.id('library-view-selector'))).toBeVisibleOnScreen();
      await expect(element(by.text('Recent'))).toBeVisibleOnScreen();
      await expect(element(by.text('Categories'))).toBeVisibleOnScreen();
      await expect(element(by.text('Tags'))).toBeVisibleOnScreen();
    });

    it('should organize content by categories', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Switch to categories view
      await element(by.text('Categories')).tap();
      await expect(element(by.id('categories-view'))).toBeVisibleOnScreen();

      // Should show category groups
      await expect(element(by.text('Technology'))).toBeVisibleOnScreen();
      await expect(element(by.text('Health'))).toBeVisibleOnScreen();
      await expect(element(by.text('Cooking'))).toBeVisibleOnScreen();

      // Expand category
      await element(by.text('Technology')).tap();
      await expect(element(by.text('Technology Trends 2024'))).toBeVisibleOnScreen();
    });

    it('should organize content by tags', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Switch to tags view
      await element(by.text('Tags')).tap();
      await expect(element(by.id('tags-view'))).toBeVisibleOnScreen();

      // Should show tag cloud or list
      await expect(element(by.id('tag-cloud'))).toBeVisibleOnScreen();

      // Filter by tag
      await element(by.text('productivity')).tap();
      await expect(element(by.text('Productivity Hacks'))).toBeVisibleOnScreen();
    });

    it('should support custom collections', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Create new collection
      await element(by.id('create-collection-button')).tap();
      await expect(element(by.id('collection-creation-modal'))).toBeVisibleOnScreen();

      await element(by.id('collection-name-input')).typeText('Work Reading');
      await element(by.id('collection-description-input')).typeText('Articles for work');
      await element(by.id('create-collection-button')).tap();

      // Should show new collection
      await expect(element(by.text('Work Reading'))).toBeVisibleOnScreen();

      // Add content to collection
      await element(by.text('Technology Trends 2024')).longPress();
      await element(by.text('Add to Collection')).tap();
      await element(by.text('Work Reading')).tap();
      await expect(element(by.text('Added to collection'))).toBeVisibleOnScreen();
    });
  });

  describe('Search Functionality', () => {
    it('should search content by title and content', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open search
      await element(by.id('search-button')).tap();
      await expect(element(by.id('search-screen'))).toBeVisibleOnScreen();

      // Search by title
      await element(by.id('search-input')).typeText('Technology');
      await element(by.id('search-submit-button')).tap();

      // Should show matching results
      await expect(element(by.text('Technology Trends 2024'))).toBeVisibleOnScreen();
      await expect(element(by.id('search-results-list'))).toBeVisibleOnScreen();
    });

    it('should support advanced search filters', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await element(by.id('search-button')).tap();

      // Open advanced search
      await element(by.id('advanced-search-button')).tap();
      await expect(element(by.id('advanced-search-form'))).toBeVisibleOnScreen();

      // Set date range
      await element(by.id('date-range-button')).tap();
      await element(by.text('Last 7 days')).tap();

      // Set content type
      await element(by.id('content-type-filter')).tap();
      await element(by.text('Articles')).tap();

      // Set reading time
      await element(by.id('reading-time-slider')).swipe('right', 'slow', 0.5);

      // Apply filters
      await element(by.id('apply-advanced-search-button')).tap();

      // Should show filtered results
      await expect(element(by.id('search-results-list'))).toBeVisibleOnScreen();
      await expect(element(by.text('Filters applied'))).toBeVisibleOnScreen();
    });

    it('should save and reuse search queries', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await element(by.id('search-button')).tap();

      // Perform search
      await element(by.id('search-input')).typeText('productivity tips');
      await element(by.id('search-submit-button')).tap();

      // Save search
      await element(by.id('save-search-button')).tap();
      await element(by.id('search-name-input')).typeText('Productivity Content');
      await element(by.id('save-search-confirm-button')).tap();

      // Should show in saved searches
      await element(by.id('saved-searches-tab')).tap();
      await expect(element(by.text('Productivity Content'))).toBeVisibleOnScreen();

      // Use saved search
      await element(by.text('Productivity Content')).tap();
      await expect(element(by.text('Productivity Hacks'))).toBeVisibleOnScreen();
    });

    it('should highlight search terms in results', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await element(by.id('search-button')).tap();

      await element(by.id('search-input')).typeText('health');
      await element(by.id('search-submit-button')).tap();

      // Should highlight search terms
      await expect(element(by.id('highlighted-search-term'))).toBeVisibleOnScreen();
    });
  });

  describe('Content Tagging', () => {
    it('should add tags to content', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open content detail
      await element(by.text('Technology Trends 2024')).tap();
      await expect(element(by.id('content-detail-screen'))).toBeVisibleOnScreen();

      // Add tags
      await element(by.id('add-tags-button')).tap();
      await element(by.id('tag-input')).typeText('technology, trends, 2024');
      await element(by.id('save-tags-button')).tap();

      // Should show tags on content
      await expect(element(by.text('technology'))).toBeVisibleOnScreen();
      await expect(element(by.text('trends'))).toBeVisibleOnScreen();
      await expect(element(by.text('2024'))).toBeVisibleOnScreen();
    });

    it('should suggest tags based on content', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await element(by.text('Health and Wellness Guide')).tap();

      await element(by.id('add-tags-button')).tap();

      // Should show suggested tags
      await expect(element(by.id('suggested-tags-section'))).toBeVisibleOnScreen();
      await expect(element(by.text('health'))).toBeVisibleOnScreen();
      await expect(element(by.text('wellness'))).toBeVisibleOnScreen();

      // Apply suggested tag
      await element(by.text('health')).tap();
      await element(by.id('save-tags-button')).tap();

      await expect(element(by.text('health'))).toBeVisibleOnScreen();
    });

    it('should manage global tag library', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open tag management
      await element(by.id('library-settings-button')).tap();
      await element(by.text('Manage Tags')).tap();
      await expect(element(by.id('tag-management-screen'))).toBeVisibleOnScreen();

      // Should show all tags with usage counts
      await expect(element(by.id('tag-list'))).toBeVisibleOnScreen();

      // Rename a tag
      await element(by.text('technology')).longPress();
      await element(by.text('Rename')).tap();
      await element(by.id('tag-name-input')).clearText();
      await element(by.id('tag-name-input')).typeText('tech');
      await element(by.id('save-tag-button')).tap();

      // Should update across all content
      await expect(element(by.text('tech'))).toBeVisibleOnScreen();
    });
  });

  describe('Content Prioritization', () => {
    it('should mark content as favorites', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Mark as favorite
      await element(by.text('Technology Trends 2024')).longPress();
      await element(by.id('favorite-button')).tap();
      await expect(element(by.text('Added to favorites'))).toBeVisibleOnScreen();

      // Should show favorite indicator
      await expect(element(by.id('favorite-indicator'))).toBeVisibleOnScreen();

      // View favorites
      await element(by.id('library-filter-button')).tap();
      await element(by.text('Favorites')).tap();
      await expect(element(by.text('Technology Trends 2024'))).toBeVisibleOnScreen();
    });

    it('should set reading priority levels', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await element(by.text('Productivity Hacks')).tap();

      // Set priority
      await element(by.id('priority-button')).tap();
      await element(by.text('High Priority')).tap();
      await expect(element(by.text('Priority updated'))).toBeVisibleOnScreen();

      // Should show priority indicator
      await TestHelpers.goBack();
      await expect(element(by.id('high-priority-indicator'))).toBeVisibleOnScreen();
    });

    it('should create reading lists', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Create reading list
      await element(by.id('create-reading-list-button')).tap();
      await element(by.id('list-name-input')).typeText('Weekend Reading');
      await element(by.id('create-list-button')).tap();

      // Add content to list
      await element(by.text('Travel Photography Tips')).longPress();
      await element(by.text('Add to Reading List')).tap();
      await element(by.text('Weekend Reading')).tap();

      // View reading list
      await element(by.id('reading-lists-tab')).tap();
      await element(by.text('Weekend Reading')).tap();
      await expect(element(by.text('Travel Photography Tips'))).toBeVisibleOnScreen();
    });
  });

  describe('Archive Management', () => {
    it('should archive and unarchive content', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Archive content
      await element(by.text('Cooking Recipe')).longPress();
      await element(by.id('archive-button')).tap();
      await expect(element(by.text('Archived'))).toBeVisibleOnScreen();

      // Content should be hidden from main view
      await expect(element(by.text('Cooking Recipe'))).not.toBeVisible();

      // View archived content
      await element(by.id('library-filter-button')).tap();
      await element(by.text('Archived')).tap();
      await expect(element(by.text('Cooking Recipe'))).toBeVisibleOnScreen();

      // Unarchive
      await element(by.text('Cooking Recipe')).longPress();
      await element(by.id('unarchive-button')).tap();
      await expect(element(by.text('Unarchived'))).toBeVisibleOnScreen();
    });

    it('should bulk archive old content', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open bulk actions
      await element(by.id('library-settings-button')).tap();
      await element(by.text('Bulk Actions')).tap();

      // Archive content older than 30 days
      await element(by.text('Archive Old Content')).tap();
      await element(by.id('archive-older-than-input')).typeText('30');
      await element(by.id('confirm-bulk-archive-button')).tap();

      await expect(element(by.text('Bulk archive completed'))).toBeVisibleOnScreen();
    });
  });

  describe('Organization Analytics', () => {
    it('should show content organization statistics', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open statistics
      await element(by.id('library-stats-button')).tap();
      await expect(element(by.id('library-statistics-screen'))).toBeVisibleOnScreen();

      // Should show various metrics
      await expect(element(by.id('total-content-count'))).toBeVisibleOnScreen();
      await expect(element(by.id('reading-progress-chart'))).toBeVisibleOnScreen();
      await expect(element(by.id('category-distribution-chart'))).toBeVisibleOnScreen();
      await expect(element(by.id('tag-usage-stats'))).toBeVisibleOnScreen();
    });

    it('should provide organization suggestions', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open suggestions
      await element(by.id('organization-suggestions-button')).tap();
      await expect(element(by.id('suggestions-screen'))).toBeVisibleOnScreen();

      // Should show AI-powered suggestions
      await expect(element(by.text('Suggested tags for untagged content'))).toBeVisibleOnScreen();
      await expect(element(by.text('Recommended reading lists'))).toBeVisibleOnScreen();
      await expect(element(by.text('Duplicate content detection'))).toBeVisibleOnScreen();

      // Apply suggestion
      await element(by.id('apply-suggestion-button')).tap();
      await expect(element(by.text('Suggestion applied'))).toBeVisibleOnScreen();
    });
  });

  describe('Content Export and Sharing', () => {
    it('should export content collections', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Select collection
      await element(by.text('Work Reading')).tap();

      // Export collection
      await element(by.id('collection-menu-button')).tap();
      await element(by.text('Export')).tap();
      await expect(element(by.id('export-options-screen'))).toBeVisibleOnScreen();

      // Choose export format
      await element(by.text('PDF')).tap();
      await element(by.id('export-button')).tap();

      await expect(element(by.text('Export completed'))).toBeVisibleOnScreen();
    });

    it('should share reading lists', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Open reading list
      await element(by.id('reading-lists-tab')).tap();
      await element(by.text('Weekend Reading')).tap();

      // Share list
      await element(by.id('share-list-button')).tap();
      await expect(element(by.id('share-options-modal'))).toBeVisibleOnScreen();

      await element(by.text('Share Link')).tap();
      await expect(element(by.text('Share link copied'))).toBeVisibleOnScreen();
    });
  });
});