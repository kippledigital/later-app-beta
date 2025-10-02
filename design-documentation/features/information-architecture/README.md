---
title: Later App Information Architecture
description: Complete app structure, navigation patterns, and content organization strategy
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - ../user-personas/README.md
  - ../user-journeys/README.md
  - ../../design-system/components/navigation.md
status: draft
---

# Information Architecture

## Overview

The Later app information architecture is designed around the core principle of **calm technology** — creating an organized, predictable structure that reduces cognitive load while supporting contextual content discovery and mindful consumption. The architecture supports three primary user flows: **Capture**, **Consume**, and **Organize**.

## Design Philosophy

### Calm Technology Principles Applied
- **Contextual Intelligence**: Information surfaces when and where it's most relevant
- **Reduced Cognitive Load**: Clear hierarchy and navigation that doesn't require learning
- **User Agency**: Users maintain control over their content organization and consumption
- **Mindful Consumption**: Structure encourages deep engagement over superficial browsing

### Information Architecture Goals
1. **Frictionless Capture**: Save content from anywhere without interrupting current task
2. **Intelligent Surfacing**: Right content appears at the right time automatically
3. **Flexible Organization**: Multiple ways to organize and rediscover content
4. **Seamless Flow**: Smooth transitions between capture, consumption, and organization

---

## App Structure Overview

### Primary Navigation (Bottom Tab Bar)

The three-tab structure reflects the core user mental model and workflow:

```
┌─────────┬─────────┬─────────┐
│   Now   │  Inbox  │ Library │
│ Context │ Capture │ Archive │
└─────────┴─────────┴─────────┘
```

#### Navigation Philosophy
- **Three-Tab Limit**: Prevents choice paralysis and maintains focus
- **Left-to-Right Flow**: Natural reading order from immediate context to organized archive
- **Semantic Clarity**: Each tab name clearly indicates its purpose and content
- **Persistent Access**: All three areas always accessible for flexible workflow support

### Global Actions (Floating Action Button)

**Quick Capture FAB** - Always accessible capture mechanism
- **Location**: Bottom-right corner, above navigation bar
- **States**: Default (plus icon) → Expanded (capture options) → Focused (specific capture mode)
- **Actions**: Text note, link capture, voice note, photo/screenshot capture

---

## Detailed Screen Architecture

### Tab 1: Now (Contextual Intelligence)

**Purpose**: Surface the most relevant content for current context and available time

#### Screen Structure
```
┌─────────────────────────────────┐
│ ⚡ Now                    ⚙️  │ Header
├─────────────────────────────────┤
│ 📍 Context Indicator           │ Context Bar
├─────────────────────────────────┤
│ 🎯 Suggested for You           │ Primary Content
│ ┌─────────────────────────────┐ │
│ │ Content Card 1              │ │
│ │ • 5 min read               │ │
│ │ • Based on your interests  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Content Card 2              │ │
│ │ • Audio available          │ │
│ │ • Commute-friendly         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📚 Continue Reading            │ Secondary Content
│ ┌─────────────────────────────┐ │
│ │ In Progress Article         │ │
│ │ • 60% complete             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Information Hierarchy
1. **Context Awareness**: Current location, time, calendar availability
2. **Immediate Suggestions**: 2-3 pieces of content optimal for current context
3. **Continued Reading**: Previously started content with progress indication
4. **Contextual Actions**: Quick access to relevant capture and organization tools

#### Context Detection Elements
- **Time-Based**: "Good morning", "Lunch break", "Evening reading"
- **Location-Based**: "At home", "Commuting", "At office" (with user permission)
- **Calendar-Based**: "15 minutes until next meeting", "Free evening ahead"
- **Device-Based**: "Headphones connected" (audio suggestions), "Large screen" (detailed content)

### Tab 2: Inbox (Capture & Triage)

**Purpose**: Raw content capture queue with efficient triage and organization tools

#### Screen Structure
```
┌─────────────────────────────────┐
│ 📥 Inbox              🔍 Sort   │ Header
├─────────────────────────────────┤
│ ✨ New (3)                     │ Filter Tabs
│ ⏸️  In Progress (2)             │
│ 📋 All Items (12)              │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │ Content List
│ │ 🔗 Article Title           │ │
│ │ 📰 source.com • 8 min read │ │
│ │ AI: Key insights about...   │ │
│ │ [Archive] [Tag] [Read]     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🎵 Podcast Episode         │ │
│ │ 🎙️ podcastname • 45 min    │ │
│ │ AI: Discussion covers...    │ │
│ │ [Archive] [Tag] [Listen]   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ⊕ Quick Capture                │ Global Action
└─────────────────────────────────┘
```

#### Information Hierarchy
1. **Status Filtering**: New, In Progress, All Items for efficient processing
2. **Content Cards**: Rich preview with source, time estimate, AI summary
3. **Quick Actions**: Swipe gestures and tap actions for rapid triage
4. **Batch Operations**: Multi-select for bulk organization and archiving

#### Triage Interaction Patterns
- **Swipe Left**: Archive item (remove from inbox)
- **Swipe Right**: Quick tag assignment with smart suggestions
- **Tap**: Open for reading/listening
- **Long Press**: Multi-select mode for batch operations
- **Pull to Refresh**: Check for new content and sync across devices

### Tab 3: Library (Organization & Discovery)

**Purpose**: Organized content archive with powerful search and rediscovery tools

#### Screen Structure
```
┌─────────────────────────────────┐
│ 📚 Library           🔍 Search  │ Header
├─────────────────────────────────┤
│ 🏷️ All  📊 Work  🌱 Personal   │ Category Filters
│ 🎓 Learning  ⭐ Favorites      │
├─────────────────────────────────┤
│ 📊 Work (24 items)             │ Category Section
│ ┌─────────────────────────────┐ │
│ │ 📈 Market Analysis Report   │ │
│ │ 🗓️ Last week • Highlighted  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 💼 Industry Trends Article │ │
│ │ 🗓️ 3 days ago • Bookmarked │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🌱 Personal (8 items)          │ Category Section
│ ┌─────────────────────────────┐ │
│ │ 🧘 Mindfulness Guide       │ │
│ │ 🗓️ Yesterday • 15 min read │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Information Hierarchy
1. **Category Navigation**: Visual tag-based filtering system
2. **Content Grouping**: Organized by category with item counts
3. **Rich Metadata**: Timestamps, reading progress, engagement indicators
4. **Discovery Tools**: Search, filter, and sort capabilities for content rediscovery

#### Organization Systems
- **Smart Categories**: AI-suggested categorization with user refinement
- **Manual Tags**: User-created organizational system
- **Time-Based**: Recent, This Week, This Month, Archive
- **Engagement-Based**: Favorites, Highlighted, Shared, Completed

---

## Content Card Architecture

### Universal Card Components

Every content card across the app maintains consistent information architecture:

```
┌─────────────────────────────────┐
│ 🔗 Content Type Icon            │ Visual Identifier
│ Article/Podcast/Video Title     │ Primary Information
│ Source Name • Time Estimate    │ Secondary Information
│ AI Summary Preview             │ Value-Add Information
│ [Tags] • Timestamp • Progress  │ Metadata
│ [Primary Action] [Secondary]   │ Available Actions
└─────────────────────────────────┘
```

#### Card Information Hierarchy
1. **Content Type**: Visual icon indicating article, podcast, video, etc.
2. **Title**: Clear, truncated title with full title on tap
3. **Source & Duration**: Publisher/author and estimated engagement time
4. **AI Enhancement**: Brief summary or key insight preview
5. **Metadata**: User-added tags, save timestamp, reading progress
6. **Actions**: Context-appropriate primary and secondary actions

### Context-Aware Card Variations

#### Now Screen Cards
- **Context Match Indicator**: Why this content is suggested now
- **Time Alignment**: "Perfect for your 15-minute break"
- **Location Relevance**: "Great for commute listening"
- **Calendar Integration**: "Prep for 3pm meeting"

#### Inbox Cards
- **Processing Status**: New, In Progress, Needs Review
- **AI Confidence**: How confident the AI is in categorization
- **Source Credibility**: Visual indicators for trusted vs. unknown sources
- **Duplicate Detection**: Indication of similar content already saved

#### Library Cards
- **Engagement History**: When last accessed, highlights made, shared
- **Related Content**: Visual links to similar or referenced content
- **Collection Membership**: Which user-created collections include this item
- **Archive Status**: Active vs. archived with quick restore option

---

## Navigation Patterns

### Primary Navigation (Tab Bar)

#### Visual Design Specifications
- **Height**: 84px (including safe area on iOS)
- **Background**: White with subtle top shadow for depth
- **Active State**: Primary color with icon and label
- **Inactive State**: Neutral gray with icon only
- **Badge Support**: Unread counts with calm, non-intrusive styling

#### Interaction Patterns
- **Single Tap**: Navigate to tab
- **Double Tap**: Scroll to top of current tab (when already active)
- **Long Press**: Quick actions menu for tab-specific functions
- **Swipe Gesture**: Horizontal swipe between tabs (optional power user feature)

#### Accessibility Considerations
- **Screen Reader Labels**: Clear descriptions including unread counts
- **Focus Management**: Logical focus order and clear focus indicators
- **Touch Targets**: Minimum 44×44px with adequate spacing
- **Badge Announcements**: Unread counts announced without overwhelming

### Secondary Navigation

#### Within-Tab Navigation
- **Filter Chips**: Horizontal scrolling category filters
- **Search Integration**: Expandable search with smart suggestions
- **Sort Controls**: Time, relevance, reading progress options
- **View Controls**: List vs. card view toggle

#### Modal Navigation
- **Reading Mode**: Full-screen content consumption with minimal chrome
- **Capture Flows**: Step-by-step content addition with clear progress
- **Settings Screens**: Organized preference management
- **Onboarding**: Progressive disclosure of features and permissions

---

## Search & Discovery Architecture

### Universal Search

#### Search Functionality
- **Full-Text Search**: Content within articles, summaries, and user notes
- **Smart Suggestions**: Query completion and typo correction
- **Recent Searches**: Quick access to previous search terms
- **Saved Searches**: Bookmark complex queries for repeated use

#### Search Result Hierarchy
1. **Exact Matches**: Direct title and content matches
2. **Semantic Matches**: AI-powered relevance matching
3. **Tag Matches**: User and AI-generated tag matches
4. **Related Content**: Similar topics and themes

### Content Discovery Features

#### AI-Powered Suggestions
- **Similar Content**: Based on reading history and preferences
- **Trending Topics**: Popular content within user's interest areas
- **Missed Opportunities**: Previously saved but unread content
- **Serendipitous Discovery**: Occasional surprising but relevant suggestions

#### Social Discovery (Future)
- **Shared Collections**: Content shared by trusted sources
- **Expert Recommendations**: Curated content from domain experts
- **Community Insights**: Popular content within user's professional network
- **Discussion Threads**: Conversations around shared content

---

## Content Flow Architecture

### Capture → Consume → Organize Workflow

#### Capture Entry Points
1. **Internal Quick Capture**: FAB → capture form → immediate save
2. **Share Sheet Integration**: External app → Later share → categorized save
3. **Email Forwarding**: Email → Later processing → inbox appearance
4. **Browser Extension**: Web content → one-click save → background processing

#### Consumption Transitions
1. **Now Suggestions**: Context-aware → immediate reading/listening
2. **Inbox Processing**: Triage → decision to consume now or later
3. **Library Browsing**: Discovery → intentional content selection
4. **Search Results**: Query → relevant content → consumption choice

#### Organization Workflows
1. **Automatic Processing**: AI categorization → user review → refinement
2. **Manual Organization**: User-driven tagging → collection creation → sharing
3. **Progressive Enhancement**: Usage patterns → improved suggestions → learned preferences
4. **Archive Management**: Completed content → archival → space management

### Cross-Screen State Management

#### Content State Synchronization
- **Reading Progress**: Synced across all devices and screens
- **Interaction History**: Highlights, notes, and bookmarks preserved
- **Organization Changes**: Tags and categories updated in real-time
- **Context Preservation**: Return to exact location in content after interruption

#### User Preference Continuity
- **Interface Customization**: Theme, layout, and density preferences maintained
- **Notification Settings**: Context-aware notification preferences respected
- **AI Learning**: Content preferences and feedback continuously refined
- **Privacy Controls**: User data boundaries consistently enforced

---

## Information Architecture Testing

### Usability Validation

#### Navigation Efficiency Tests
- **Time to Content**: Measure speed from app launch to content consumption
- **Task Completion**: Success rates for capture, organization, and discovery tasks
- **Error Recovery**: User ability to correct mistakes and return to desired content
- **Mental Model Alignment**: Match between user expectations and actual app behavior

#### Cognitive Load Assessment
- **Information Overwhelm**: Monitor for signs of choice paralysis or anxiety
- **Decision Fatigue**: Track user engagement across extended usage sessions
- **Learning Curve**: Time required for new users to achieve proficiency
- **Expertise Scaling**: How well the interface grows with user sophistication

### Accessibility Compliance Testing

#### Screen Reader Navigation
- **Logical Reading Order**: Content announces in meaningful sequence
- **Landmark Identification**: Clear section boundaries and navigation structure
- **Interactive Element Description**: All buttons and controls clearly described
- **Dynamic Content Announcements**: Changes communicated appropriately

#### Motor Accessibility
- **Touch Target Sizing**: All interactive elements meet minimum size requirements
- **Gesture Alternatives**: Non-gesture methods available for all actions
- **One-Handed Operation**: Core functions accessible with single hand
- **Reduced Dexterity Support**: Interface accommodates limited fine motor control

---

## Implementation Considerations

### Technical Architecture Alignment

#### State Management Requirements
- **Global State**: User preferences, authentication, and cross-tab content
- **Local State**: Screen-specific UI state and temporary interactions
- **Cache Management**: Intelligent caching for offline access and performance
- **Sync Coordination**: Conflict resolution for multi-device content management

#### Performance Optimization
- **Lazy Loading**: Content loads as needed to maintain responsive interface
- **Image Optimization**: Adaptive image sizing based on device and context
- **Background Processing**: AI analysis and content preparation during idle time
- **Memory Management**: Efficient handling of large content libraries

### Platform-Specific Adaptations

#### iOS Implementation
- **Navigation Bar Integration**: Proper use of iOS navigation patterns
- **Swipe Gestures**: Consistent with iOS gesture conventions
- **Deep Linking**: Proper handling of external app integration
- **Notification Integration**: iOS notification system for contextual suggestions

#### Android Implementation
- **Material Design Compliance**: Appropriate use of Android design patterns
- **Back Button Behavior**: Proper navigation stack management
- **App Shortcuts**: Quick actions from home screen for common tasks
- **Share Target Integration**: Proper implementation of Android sharing

#### Web Implementation
- **URL Structure**: Clean, bookmarkable URLs for content and organization
- **Browser Navigation**: Proper use of browser back/forward functionality
- **Responsive Design**: Adaptive layout for various screen sizes
- **Progressive Web App**: Offline capability and app-like experience

---

This information architecture provides a comprehensive foundation for creating an intuitive, accessible, and calm technology-aligned user experience that supports mindful content consumption while reducing information anxiety.