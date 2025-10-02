---
title: Navigation Components - Later App Design System
description: Complete navigation component specifications including bottom tabs, headers, and interaction patterns
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - ../style-guide.md
  - ../tokens/colors.md
  - ../tokens/animations.md
  - ../../accessibility/guidelines.md
status: draft
---

# Navigation Components

## Overview

Navigation components in the Later app are designed to support the three-tab structure (Now, Inbox, Library) while maintaining calm technology principles. All navigation elements prioritize clarity, accessibility, and seamless user flow over visual decoration.

## Component Philosophy

### Calm Technology Navigation
- **Predictable Structure**: Navigation behaves consistently across all contexts
- **Minimal Cognitive Load**: Clear hierarchy without overwhelming choices
- **Context Awareness**: Navigation adapts to user context without being intrusive
- **Accessible by Default**: Full support for assistive technologies and diverse interaction methods

---

## Bottom Tab Bar

### Primary Navigation Component

The bottom tab bar serves as the main navigation interface, providing persistent access to the three core app sections.

#### Visual Specifications

**Container**
- **Height**: `84px` (includes safe area padding)
- **Background**: `#FFFFFF` (White)
- **Border**: `1px solid #E0E0E0` (Neutral-200) top border only
- **Shadow**: `0 -2px 8px rgba(0, 0, 0, 0.06)` subtle elevation
- **Safe Area**: Automatic padding for home indicator on iOS

**Tab Item Layout**
- **Width**: Equal distribution across container width
- **Touch Target**: Minimum `44×44px` for accessibility
- **Internal Padding**: `8px` vertical, `12px` horizontal
- **Icon Size**: `24×24px` for clear recognition
- **Label Typography**: Caption (12px), Medium weight when active

#### Tab Item States

**Active State**
```css
.tab-item-active {
  color: var(--color-primary); /* #4A90E2 */
  font-weight: 500;
  transition: color 150ms ease-out-gentle;
}

.tab-item-active .tab-icon {
  color: var(--color-primary);
  transform: scale(1.1);
}
```

**Inactive State**
```css
.tab-item-inactive {
  color: var(--color-neutral-500); /* #8A8A8A */
  font-weight: 400;
  transition: color 150ms ease-out-gentle;
}

.tab-item-inactive:hover {
  color: var(--color-neutral-600); /* Desktop hover state */
}
```

**Disabled State**
```css
.tab-item-disabled {
  color: var(--color-neutral-300);
  opacity: 0.6;
  pointer-events: none;
}
```

**Focus State**
```css
.tab-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### Badge Indicators

**Unread Count Badge**
- **Background**: `#E74C3C` (Error color for attention)
- **Text Color**: `#FFFFFF` (White)
- **Typography**: `11px`, Bold weight
- **Size**: `20×20px` minimum, expands horizontally for larger numbers
- **Position**: Top-right corner of icon, `2px` offset
- **Max Display**: Shows "99+" for counts over 99

```css
.tab-badge {
  background-color: var(--color-error);
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -2px;
  right: -2px;
  padding: 0 6px;
}
```

#### Interaction Patterns

**Single Tap**
- Navigate to tab immediately
- Smooth transition with content fade-in
- Update active state with subtle animation

**Double Tap (When Already Active)**
- Scroll to top of current tab content
- Gentle scroll animation with ease-out timing
- Haptic feedback on iOS for confirmation

**Long Press**
- Show quick actions contextual menu
- Fade in menu with backdrop
- Options: Search, Filter, Settings (context-dependent)

### Accessibility Implementation

#### Screen Reader Support
```html
<nav role="tablist" aria-label="Main navigation">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="now-panel"
    aria-label="Now tab, your contextual content suggestions"
    id="now-tab"
  >
    <span aria-hidden="true">⚡</span>
    <span>Now</span>
    <span aria-live="polite" class="sr-only">3 unread items</span>
  </button>

  <button
    role="tab"
    aria-selected="false"
    aria-controls="inbox-panel"
    aria-label="Inbox tab, your captured content"
    id="inbox-tab"
  >
    <span aria-hidden="true">📥</span>
    <span>Inbox</span>
  </button>

  <button
    role="tab"
    aria-selected="false"
    aria-controls="library-panel"
    aria-label="Library tab, your organized content"
    id="library-tab"
  >
    <span aria-hidden="true">📚</span>
    <span>Library</span>
  </button>
</nav>
```

#### React Native Implementation
```typescript
interface TabBarProps {
  activeTab: 'now' | 'inbox' | 'library';
  onTabPress: (tab: string) => void;
  badges?: Record<string, number>;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress, badges }) => {
  return (
    <View style={styles.tabBar}>
      <TabItem
        icon="⚡"
        label="Now"
        isActive={activeTab === 'now'}
        onPress={() => onTabPress('now')}
        accessibilityLabel="Now tab, your contextual content suggestions"
        badge={badges?.now}
      />
      <TabItem
        icon="📥"
        label="Inbox"
        isActive={activeTab === 'inbox'}
        onPress={() => onTabPress('inbox')}
        accessibilityLabel="Inbox tab, your captured content"
        badge={badges?.inbox}
      />
      <TabItem
        icon="📚"
        label="Library"
        isActive={activeTab === 'library'}
        onPress={() => onTabPress('library')}
        accessibilityLabel="Library tab, your organized content"
        badge={badges?.library}
      />
    </View>
  );
};
```

---

## Screen Headers

### Standard Header Component

Screen headers provide context, navigation, and access to screen-specific actions while maintaining visual consistency.

#### Visual Specifications

**Container**
- **Height**: `64px` (standard), `94px` (with large title)
- **Background**: `#FFFFFF` (White) or `transparent` based on context
- **Padding**: `16px` horizontal, `12px` vertical
- **Safe Area**: Automatic top padding for status bar

**Title Typography**
- **Font**: Inter, 20px, Semibold (600)
- **Color**: `#1A1A1A` (Neutral-900)
- **Alignment**: Left-aligned for consistency
- **Truncation**: Ellipsis for long titles

#### Header Variants

**Standard Header**
```
┌─────────────────────────────────┐
│ ← Back     Page Title    ⚙️     │
└─────────────────────────────────┘
```

**Large Title Header**
```
┌─────────────────────────────────┐
│ ← Back                   ⚙️     │
│                                 │
│ Large Page Title                │
└─────────────────────────────────┘
```

**Search Header**
```
┌─────────────────────────────────┐
│ ✕ Cancel  [Search box...]  🔍   │
└─────────────────────────────────┘
```

#### Action Button Specifications

**Primary Action Button**
- **Size**: `44×44px` touch target
- **Visual Size**: `24×24px` icon
- **Color**: `#4A90E2` (Primary blue)
- **Background**: Transparent
- **Hover**: 50% opacity overlay (desktop)

**Secondary Action Button**
- **Size**: `44×44px` touch target
- **Visual Size**: `24×24px` icon
- **Color**: `#6B6B6B` (Neutral-600)
- **Background**: Transparent

### Context-Aware Headers

#### Now Screen Header
```typescript
const NowHeader = () => (
  <Header
    title="Now"
    leftIcon="⚡"
    rightAction={
      <Button
        icon="⚙️"
        accessibilityLabel="Settings"
        onPress={openSettings}
      />
    }
    subtitle="Good morning, Maya • At home"
  />
);
```

#### Reading Mode Header
```typescript
const ReaderHeader = () => (
  <Header
    leftAction={
      <Button
        icon="←"
        accessibilityLabel="Back to content list"
        onPress={goBack}
      />
    }
    rightActions={[
      <Button
        icon="🎧"
        accessibilityLabel="Listen to this article"
        onPress={startAudio}
      />,
      <Button
        icon="⋯"
        accessibilityLabel="More options"
        onPress={showMoreOptions}
      />
    ]}
    transparent
  />
);
```

---

## Floating Action Button (FAB)

### Quick Capture Component

The FAB provides persistent access to content capture functionality across all main screens.

#### Visual Specifications

**Container**
- **Size**: `56×56px` for comfortable touch interaction
- **Background**: Linear gradient from `#4A90E2` to `#357ABD`
- **Shadow**: `0 4px 12px rgba(74, 144, 226, 0.3)`
- **Border Radius**: `28px` (perfect circle)
- **Position**: Fixed, `16px` from bottom-right, above tab bar

**Icon**
- **Size**: `24×24px`
- **Color**: `#FFFFFF` (White)
- **Symbol**: `+` in default state, transforms to `×` in expanded state

#### Interaction States

**Default State**
```css
.fab-default {
  transform: scale(1);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  transition: all 200ms ease-out-gentle;
}
```

**Pressed State**
```css
.fab-pressed {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
}
```

**Expanded State**
```css
.fab-expanded {
  transform: rotate(45deg);
  background: linear-gradient(135deg, #E74C3C, #C0392B);
}
```

#### Capture Options Expansion

When activated, the FAB reveals capture options in a radial menu:

**Option Layout**
- **Radius**: `80px` from FAB center
- **Options**: 4 capture types (Text, Link, Voice, Photo)
- **Stagger**: 50ms delay between option appearances
- **Background**: Semi-transparent overlay (`rgba(0, 0, 0, 0.3)`)

```typescript
const CaptureOptions = [
  {
    icon: '📝',
    label: 'Text Note',
    action: 'text',
    position: { x: 0, y: -80 }, // Above FAB
  },
  {
    icon: '🔗',
    label: 'Link',
    action: 'link',
    position: { x: -56, y: -56 }, // Top-left diagonal
  },
  {
    icon: '🎤',
    label: 'Voice',
    action: 'voice',
    position: { x: -80, y: 0 }, // Left
  },
  {
    icon: '📸',
    label: 'Photo',
    action: 'photo',
    position: { x: -56, y: 56 }, // Bottom-left diagonal
  },
];
```

### Accessibility Implementation

#### Screen Reader Support
```html
<button
  aria-label="Quick capture content"
  aria-expanded="false"
  aria-haspopup="menu"
  class="fab"
>
  <span aria-hidden="true">+</span>
</button>

<!-- When expanded -->
<div role="menu" aria-label="Capture options">
  <button role="menuitem" aria-label="Create text note">
    <span aria-hidden="true">📝</span>
    Text Note
  </button>
  <!-- Additional options... -->
</div>
```

#### Focus Management
- **Initial Focus**: FAB receives focus when activated
- **Menu Focus**: First menu item receives focus when options expand
- **Escape Handling**: ESC key closes menu and returns focus to FAB
- **Outside Click**: Clicking outside menu closes it and restores focus

---

## Search Interface

### Search Header Component

The search interface replaces the standard header when users activate search functionality.

#### Visual Specifications

**Search Input**
- **Height**: `44px` for comfortable touch interaction
- **Background**: `#F5F5F5` (Neutral-100)
- **Border**: `1px solid #E0E0E0` (Neutral-200)
- **Border Radius**: `8px` for friendly appearance
- **Padding**: `12px 16px`
- **Typography**: Body text (16px) to prevent iOS zoom

**Search States**
```css
.search-input {
  background-color: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  transition: all 150ms ease-out-gentle;
}

.search-input:focus {
  background-color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}
```

#### Search Functionality

**Instant Search**
- **Debounce**: 300ms delay to prevent excessive API calls
- **Minimum Characters**: 2 characters before search begins
- **Results Update**: Live results as user types
- **Keyboard Shortcuts**: CMD+K (desktop) to activate search

**Search Suggestions**
- **Recent Searches**: Last 5 search queries
- **Smart Suggestions**: AI-powered query completion
- **Category Filters**: Quick filters for content type
- **Saved Searches**: Bookmark complex queries

#### React Native Implementation
```typescript
interface SearchHeaderProps {
  onCancel: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  onCancel,
  onSearch,
  placeholder = "Search your content...",
  autoFocus = true,
}) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () => debounce(onSearch, 300),
    [onSearch]
  );

  useEffect(() => {
    if (query.length >= 2) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);

  return (
    <View style={styles.searchHeader}>
      <Button
        title="Cancel"
        onPress={onCancel}
        accessibilityLabel="Cancel search"
      />
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel="Search input"
      />
      <Button
        icon="🔍"
        accessibilityLabel="Search"
        disabled={query.length < 2}
      />
    </View>
  );
};
```

---

## Navigation Transitions

### Screen Transition Animations

#### Tab Switching Animation
```css
@keyframes tabContentEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content-enter {
  animation: tabContentEnter 300ms ease-out-gentle;
}
```

#### Modal Presentation
```css
@keyframes modalSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-enter {
  animation: modalSlideUp 400ms ease-out-gentle;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.6;
  }
}

.modal-backdrop {
  animation: backdropFadeIn 300ms ease-out-gentle;
}
```

#### Reader Mode Transition
```css
.reader-enter {
  opacity: 0;
  transform: scale(0.98);
  animation: readerAppear 350ms ease-out-gentle;
}

@keyframes readerAppear {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Responsive Navigation Patterns

### Mobile Portrait (320-414px)

**Bottom Tab Bar**
- **Standard Height**: 84px including safe area
- **Tab Labels**: Always visible for clarity
- **Icon Size**: 24px for touch accessibility
- **Badge Position**: Optimized for thumb visibility

### Mobile Landscape (568-896px)

**Compact Tab Bar**
- **Reduced Height**: 72px to maximize content area
- **Icon Focus**: Labels may be hidden on narrow screens
- **Gesture Support**: Enhanced swipe navigation between tabs
- **Quick Access**: FAB repositioned for landscape thumb reach

### Tablet Portrait (768-834px)

**Enhanced Navigation**
- **Sidebar Option**: Consider sidebar navigation for additional space
- **Larger Touch Targets**: Expanded touch areas for comfortable tablet use
- **Multi-Action Headers**: Additional header actions for larger screen
- **Split View**: Potential for split-screen content navigation

### Tablet Landscape (1024px+)

**Desktop-Like Navigation**
- **Persistent Sidebar**: Navigation sidebar with full tab content
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Hover States**: Rich hover feedback for precision pointer input
- **Context Menus**: Right-click context menus for advanced actions

---

## Implementation Guidelines

### React Native Navigation Setup

```typescript
// Bottom Tab Navigator Configuration
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tab.Screen
        name="Now"
        component={NowScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="⚡" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: "Now tab, your contextual content",
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="📥" focused={focused} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarAccessibilityLabel: "Inbox tab, your captured content",
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="📚" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: "Library tab, your organized content",
        }}
      />
    </Tab.Navigator>
  );
}
```

### Styling Constants

```typescript
export const navigationStyles = {
  tabBar: {
    height: 84,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarIcon: {
    marginTop: 8,
  },
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
```

---

This navigation system provides a comprehensive foundation for creating intuitive, accessible, and calm technology-aligned navigation throughout the Later app.