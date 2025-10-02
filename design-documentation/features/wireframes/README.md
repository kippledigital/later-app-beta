---
title: Later App Wireframes & User Flows
description: Detailed wireframes and user flow specifications for MVP features
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - ../information-architecture/README.md
  - ../user-personas/README.md
  - ../../design-system/style-guide.md
status: draft
---

# Wireframes & User Flows

## Overview

This document provides detailed wireframes and user flow specifications for the Later app MVP, designed around calm technology principles. Each wireframe includes specific annotations for interaction patterns, accessibility considerations, and responsive behavior.

## Design Principles Applied

### Calm Technology Wireframing
- **Minimal Chrome**: Focus on content with minimal interface decoration
- **Clear Hierarchy**: Visual importance matches functional importance
- **Breathing Room**: Generous whitespace prevents cognitive overload
- **Predictable Patterns**: Consistent interaction patterns across screens

### Mobile-First Approach
- **Thumb-Friendly**: Critical actions within comfortable reach zones
- **Touch Optimized**: Minimum 44×44px touch targets with adequate spacing
- **Gesture Support**: Intuitive swipe and long-press interactions
- **One-Handed Use**: Core functionality accessible with single hand

---

## Core User Flows

### Flow 1: New User Onboarding

**Goal**: Introduce calm technology principles while setting up personalized experience

#### Screen 1: Welcome & Value Proposition
```
┌─────────────────────────────────┐
│                                 │
│        🌱 Later                 │
│                                 │
│    Calm content companion      │
│                                 │
│  Save content. Read mindfully.  │
│  Never feel overwhelmed again.  │
│                                 │
│                                 │
│  ┌─────────────────────────────┐ │
│  │     Get Started             │ │ Primary CTA
│  └─────────────────────────────┘ │
│                                 │
│  Already have an account?       │
│  ┌─────────────────────────────┐ │
│  │     Sign In                 │ │ Secondary Action
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Visual Hierarchy**: Logo → Value proposition → Primary action → Secondary action
- **Copy Strategy**: Emphasizes calm and mindfulness over productivity
- **Touch Targets**: 48px height buttons with 16px spacing
- **Accessibility**: Clear heading structure, descriptive button labels

#### Screen 2: Authentication Choice
```
┌─────────────────────────────────┐
│ ← Welcome                       │ Back Navigation
├─────────────────────────────────┤
│                                 │
│    Choose sign-up method        │ Section Header
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🍎 Continue with Apple      │ │ OAuth Option
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🔵 Continue with Google     │ │ OAuth Option
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ ✉️ Continue with Email      │ │ Email Option
│  └─────────────────────────────┘ │
│                                 │
│    Privacy first, always        │ Trust Message
│    Your data stays yours        │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Privacy Emphasis**: Clear messaging about data ownership
- **Platform Integration**: Native OAuth options for reduced friction
- **Progressive Enhancement**: Email option for users preferring not to use OAuth
- **Trust Building**: Explicit privacy commitment

#### Screen 3: Content Preferences Setup
```
┌─────────────────────────────────┐
│ ← Authentication           2/4  │ Progress Indicator
├─────────────────────────────────┤
│                                 │
│   What interests you?           │ Question Header
│                                 │
│  Select topics that matter:     │ Instructions
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 💼  │ │ 💻  │ │ 🎨  │        │ Topic Pills
│  │Work │ │Tech │ │Design        │
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 📚  │ │ 🏥  │ │ 🌱  │        │
│  │Learn│ │Health│Personal       │
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│                                 │
│  ┌─────────────────────────────┐ │
│  │       Continue              │ │ Primary CTA
│  └─────────────────────────────┘ │
│                                 │
│  Skip for now                   │ Skip Option
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Multi-Select Interface**: Visual selection state with clear feedback
- **Icon + Text**: Universal symbols with clear labels for accessibility
- **Progressive Disclosure**: Can skip and refine later
- **Bite-Sized Commitment**: Quick, low-pressure setup

#### Screen 4: Context Permissions Request
```
┌─────────────────────────────────┐
│ ← Preferences              3/4  │
├─────────────────────────────────┤
│                                 │
│    📍 Smart suggestions          │ Feature Icon
│                                 │
│  Later works best when it       │ Benefit Explanation
│  knows your context:            │
│                                 │
│  • Suggest audio during         │ Concrete Examples
│    commutes                     │
│  • Recommend quick reads        │
│    during breaks                │
│  • Respect your focus time      │
│                                 │
│  ┌─────────────────────────────┐ │
│  │    Enable Location          │ │ Permission Request
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │   Connect Calendar          │ │ Permission Request
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │       Continue              │ │ Primary CTA
│  └─────────────────────────────┘ │
│                                 │
│  Not now, maybe later           │ Defer Option
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Value-First Permissions**: Explain benefits before requesting access
- **Concrete Examples**: Specific, relatable use cases
- **Optional Setup**: No penalty for declining permissions
- **Reassuring Language**: "Smart suggestions" not "tracking"

#### Screen 5: Setup Complete
```
┌─────────────────────────────────┐
│ ← Context                  4/4  │
├─────────────────────────────────┤
│                                 │
│         🎉                      │ Celebration
│                                 │
│    You're all set!              │ Completion Message
│                                 │
│  Later is ready to help you     │ Value Reinforcement
│  save and enjoy content         │
│  without the overwhelm.         │
│                                 │
│                                 │
│  💡 Pro tip: Use the share      │ Gentle Guidance
│     button in any app to        │
│     save content to Later       │
│                                 │
│                                 │
│  ┌─────────────────────────────┐ │
│  │    Start Using Later        │ │ Primary CTA
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Positive Reinforcement**: Celebration without overwhelming
- **Immediate Value**: Pro tip provides immediate actionable guidance
- **Clear Next Step**: Single, obvious action to begin using the app
- **Expectation Setting**: Reinforces calm technology value proposition

### Flow 2: Content Capture Workflows

#### Internal Quick Capture (FAB)

**Screen 1: FAB Trigger**
```
┌─────────────────────────────────┐
│                                 │
│     Main App Screen             │ Current Context
│     (Now/Inbox/Library)         │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                             ⊕   │ FAB Position
├─────────────────────────────────┤
│   Now    │  Inbox  │  Library  │ Tab Bar
└─────────────────────────────────┘
```

**Annotations**:
- **Persistent Access**: FAB available on all main screens
- **Visual Priority**: Elevated above tab bar, clear call-to-action
- **Touch Zone**: Positioned for comfortable thumb reach
- **Context Awareness**: Capture options adapt to current screen

**Screen 2: Capture Options Expansion**
```
┌─────────────────────────────────┐
│                                 │
│     Main App Screen             │
│     (Dimmed Background)         │
│                                 │
│                                 │
│                                 │
│              ┌─────┐             │
│              │ 📸  │             │ Photo/Screenshot
│              │Photo│             │
│              └─────┘             │
│              ┌─────┐             │
│              │ 🎤  │             │ Voice Note
│              │Voice│             │
│              └─────┘             │
│              ┌─────┐             │
│              │ 🔗  │             │ Link Entry
│              │Link │             │
│              └─────┘             │
│              ┌─────┐             │
│              │ 📝  │         ⊗   │ Text Note, Close
│              │Note │             │
│              └─────┘             │
└─────────────────────────────────┘
```

**Annotations**:
- **Radial Layout**: Options arranged around FAB for easy thumb access
- **Clear Icons**: Universal symbols with text labels
- **Background Dimming**: Focus attention on capture options
- **Escape Route**: Clear close option for accidental activation

**Screen 3: Quick Text Capture**
```
┌─────────────────────────────────┐
│ ✕ Cancel              Save     │ Header Actions
├─────────────────────────────────┤
│                                 │
│  Quick Note                     │ Screen Title
│                                 │
│  ┌─────────────────────────────┐ │
│  │ What's on your mind?        │ │ Text Input
│  │                             │ │
│  │                             │ │
│  │                             │ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                 │
│  📋 Add to:                     │ Quick Categorization
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │Work │ │Life │ │Ideas│        │ Category Pills
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│                                 │
│  🔗 Add link (optional)         │ Link Addition
│  ┌─────────────────────────────┐ │
│  │ https://...                 │ │ URL Input
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Auto-Save Draft**: Content saves as user types
- **Optional Categorization**: Can categorize immediately or let AI suggest later
- **Link Support**: Optional URL attachment for reference
- **Accessible Form**: Clear labels and logical tab order

#### External Share Sheet Capture

**Screen 1: Share Sheet Integration**
```
┌─────────────────────────────────┐
│                                 │
│    External App Content         │ Source Context
│                                 │
│                                 │
├─────────────────────────────────┤
│                                 │ Share Sheet
│  📱 Messages  📧 Mail  📋 Copy  │ System Options
│                                 │
│  🌱 Later     📖 Reader  🔖...  │ App Options
│                                 │
└─────────────────────────────────┘
```

**Screen 2: Later Processing Sheet**
```
┌─────────────────────────────────┐
│ Later                      ✓   │ Processing Indicator
├─────────────────────────────────┤
│                                 │
│  📄 Article Title Preview       │ Content Preview
│  📰 source.com                  │
│                                 │
│  AI is reading this article...  │ Processing Status
│  ░░░░░░░░░░□□□□□□ 67%           │ Progress Bar
│                                 │
│  📋 Suggested category:         │ AI Suggestions
│  ┌─────┐                       │
│  │Work │  ← Smart suggestion    │ Category Chip
│  └─────┘                       │
│                                 │
│  ✏️ Add note (optional)         │ Note Addition
│  ┌─────────────────────────────┐ │
│  │ Why this is interesting...  │ │ Note Input
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │        Save to Later        │ │ Primary CTA
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Immediate Processing**: Article extraction and analysis begins immediately
- **Progressive Enhancement**: AI suggestions appear as processing completes
- **User Control**: Can override AI suggestions and add personal context
- **Clear Completion**: Obvious save action completes the capture flow

### Flow 3: Content Consumption (Now Screen)

#### Screen 1: Context-Aware Content Suggestions
```
┌─────────────────────────────────┐
│ ⚡ Now                   ⚙️     │ Header with Settings
├─────────────────────────────────┤
│ 🌅 Good morning, Maya           │ Personalized Greeting
│ 📍 At home • 25 min until work │ Context Info
├─────────────────────────────────┤
│                                 │
│ ✨ Perfect for now              │ Section Header
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎯 Industry Trends Report   │ │ Primary Suggestion
│ │ 📊 MarketingLand • 8 min    │ │
│ │ ⭐ AI: Key insights about   │ │
│ │    customer behavior...     │ │
│ │                             │ │
│ │ 🎧 Listen instead          │ │ Audio Option
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📖 Mindful Leadership       │ │ Secondary Suggestion
│ │ 📚 HBR • 12 min read        │ │
│ │ 🎯 Great for morning routine │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📚 Continue Reading             │ In-Progress Section
│ ┌─────────────────────────────┐ │
│ │ 📈 Q4 Strategy Planning     │ │
│ │ ████████░░ 80% complete     │ │ Progress Bar
│ │ 📅 Started yesterday        │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Contextual Relevance**: Content suggestions match time, location, and calendar
- **Clear Value Proposition**: Why each piece of content is suggested now
- **Multiple Engagement Options**: Read vs. listen based on context
- **Progress Continuity**: Easy resumption of partially consumed content

#### Screen 2: Reader Mode (Article Consumption)
```
┌─────────────────────────────────┐
│ ← Back    🎧 Listen    ⋯ More   │ Reader Header
├─────────────────────────────────┤
│                                 │
│ Industry Trends Report          │ Article Title
│ MarketingLand • 8 min read      │ Source & Duration
│ ████░░░░░░ 40% complete         │ Progress Indicator
│                                 │
├─────────────────────────────────┤
│                                 │
│ The latest customer behavior    │ Article Content
│ data reveals significant        │ (Clean Typography)
│ shifts in purchasing patterns   │
│ across multiple demographics.   │
│                                 │
│ Key findings include:           │
│                                 │
│ • Mobile commerce increased     │
│   by 34% in Q3                  │
│ • Gen Z prefers social media    │
│   discovery over search         │
│ • Sustainability influences     │
│   67% of purchase decisions     │
│                                 │
│ [Highlighted text appears       │ User Highlights
│  with subtle background]        │
│                                 │
│ The implications for marketers  │
│ are clear: traditional          │
│ acquisition channels must...    │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Distraction-Free Design**: Minimal interface chrome focuses attention on content
- **Reading Progress**: Clear indication of progress and remaining time
- **Engagement Tools**: Highlighting and note-taking capabilities
- **Audio Alternative**: Quick switch to listening mode for accessibility or multitasking

### Flow 4: Content Organization (Library)

#### Screen 1: Library Overview with Categories
```
┌─────────────────────────────────┐
│ 📚 Library           🔍 Search  │ Header with Search
├─────────────────────────────────┤
│                                 │
│ 🏷️ All   📊 Work   🌱 Personal  │ Category Filters
│ 🎓 Learning   ⭐ Favorites      │ (Horizontal Scroll)
├─────────────────────────────────┤
│                                 │
│ 📊 Work (24 items)              │ Category Section
│ ┌─────────────────────────────┐ │
│ │ 📈 Q4 Strategy Planning     │ │ Content Card
│ │ 📅 Last week • Read         │ │
│ │ 💡 3 highlights             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🎯 Industry Trends Report   │ │
│ │ 📅 3 days ago • Highlighted │ │
│ │ ⭐ Favorited                │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🌱 Personal (8 items)           │
│ ┌─────────────────────────────┐ │
│ │ 🧘 Mindfulness at Work      │ │
│ │ 📅 Yesterday • 15 min       │ │
│ │ 🔖 Bookmarked               │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⋯ View all categories           │ Expand Option
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Visual Category System**: Color-coded and icon-based organization
- **Rich Metadata**: Engagement history and content status clearly indicated
- **Scannable Layout**: Easy to quickly assess content and status
- **Progressive Disclosure**: Show more categories without overwhelming initial view

#### Screen 2: Search & Discovery
```
┌─────────────────────────────────┐
│ ← Library                       │ Back Navigation
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search your content...   │ │ Search Input
│ └─────────────────────────────┘ │
│                                 │
│ Recent searches:                │ Search History
│ • marketing trends              │
│ • leadership articles           │
│ • Q4 planning                   │
│                                 │
│ 💡 Smart suggestions:           │ AI Recommendations
│ • Content you might have missed │
│ • Similar to your recent reads  │
│ • Popular in your field         │
│                                 │
│ 🏷️ Browse by tag:               │ Tag Cloud
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │strategy marketing analytics│  │ Tag Pills
│ └─────┘ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │leadership trends reports │   │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ 📊 Stats:                       │ Usage Insights
│ • 127 items saved this month    │
│ • 89% reading completion rate   │
│ • Top category: Work (45%)      │
│                                 │
└─────────────────────────────────┘
```

**Annotations**:
- **Progressive Search**: Multiple entry points from simple to complex queries
- **Smart Suggestions**: AI-powered content discovery without being pushy
- **Tag-Based Browsing**: Visual tag system for content exploration
- **Usage Insights**: Gentle progress tracking without pressure

---

## Responsive Design Patterns

### Mobile Portrait (320-414px)

#### Single Column Layout
- **Content Cards**: Full-width cards with comfortable padding
- **Touch Targets**: Minimum 44×44px with 8px spacing
- **Typography**: Optimized for 16px base font size
- **Navigation**: Bottom tab bar for thumb accessibility

### Mobile Landscape (568-896px)

#### Adaptive Layout
- **Content Cards**: Maintain single column but adjust padding
- **Reader Mode**: Optimize line length for comfortable reading
- **Navigation**: Maintain bottom tab bar but adjust proportions
- **Gesture Support**: Enhanced swipe gestures for navigation

### Tablet Portrait (768-834px)

#### Enhanced Density
- **Content Cards**: Two-column layout where appropriate
- **Sidebar Options**: Consider sidebar navigation for additional space
- **Typography**: Larger base font size for comfortable reading distance
- **Touch Targets**: Maintain accessibility while optimizing for larger screen

### Tablet Landscape (1024-1366px)

#### Desktop-Like Experience
- **Multi-Column**: Content and navigation in sidebar configuration
- **Keyboard Support**: Full keyboard navigation and shortcuts
- **Hover States**: Enhanced interaction feedback
- **Dense Information**: Higher information density without overwhelming

---

## Accessibility Wireframe Annotations

### Screen Reader Support

#### Semantic Structure
```
<!-- Example markup structure -->
<main aria-label="Content suggestions">
  <header>
    <h1>Now</h1>
    <button aria-label="Settings">⚙️</button>
  </header>

  <section aria-label="Contextual suggestions">
    <h2>Perfect for now</h2>
    <article aria-label="Industry Trends Report, 8 minute read">
      <h3>Industry Trends Report</h3>
      <p>MarketingLand • 8 min read</p>
      <p>AI summary: Key insights about customer behavior...</p>
      <button aria-label="Listen to this article">🎧 Listen instead</button>
    </article>
  </section>
</main>
```

### Focus Management

#### Tab Order Priority
1. **Primary Navigation**: Skip links and main navigation
2. **Primary Actions**: Most important interactive elements first
3. **Secondary Actions**: Supporting features and options
4. **Tertiary Elements**: Less critical interactive elements

#### Focus Indicators
- **High Contrast**: 2px solid outline in primary color
- **Large Target**: Focus extends beyond element boundaries
- **Color Independence**: Focus indication doesn't rely on color alone
- **Animation**: Subtle scale or shadow animation for focus changes

### Touch Accessibility

#### Target Sizing
- **Minimum Size**: 44×44px for all interactive elements
- **Comfortable Spacing**: 8px minimum between adjacent targets
- **Gesture Alternatives**: All swipe actions have button alternatives
- **One-Handed Reach**: Critical actions within comfortable thumb zones

---

## Performance & Loading States

### Content Loading Patterns

#### Progressive Enhancement
```
┌─────────────────────────────────┐
│ 📚 Library           🔍 Search  │
├─────────────────────────────────┤
│                                 │
│ 📊 Work                         │ Category Header Loads First
│ ┌─────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ Skeleton Placeholders
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📈 Q4 Strategy Planning     │ │ Content Appears Progressively
│ │ 📅 Last week • Read         │ │
│ │ 💡 3 highlights             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ Still Loading
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Offline State Handling
- **Cached Content**: Previously loaded content remains accessible
- **Sync Indicators**: Clear indication when content is syncing
- **Offline Capabilities**: Core reading functionality works without internet
- **Graceful Degradation**: AI features disabled gracefully when offline

---

## Error State Wireframes

### Network Error States

#### Connection Lost
```
┌─────────────────────────────────┐
│ 📱 Later                        │
├─────────────────────────────────┤
│                                 │
│         📡                      │ Network Icon
│                                 │
│    Connection lost              │ Clear Error Message
│                                 │
│  You're offline, but you can    │ Helpful Explanation
│  still read saved content.      │
│                                 │
│  ┌─────────────────────────────┐ │
│  │     Try Again               │ │ Retry Action
│  └─────────────────────────────┘ │
│                                 │
│  View offline content           │ Alternative Action
│                                 │
└─────────────────────────────────┘
```

#### Content Processing Error
```
┌─────────────────────────────────┐
│ ← Inbox                         │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ Couldn't process article │ │ Error Card
│ │                             │ │
│ │ This content couldn't be    │ │ Clear Explanation
│ │ extracted automatically.    │ │
│ │                             │ │
│ │ ┌─────────────┐ ┌─────────┐ │ │ Action Options
│ │ │ Try Again   │ │Save Link│ │ │
│ │ └─────────────┘ └─────────┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Annotations**:
- **Clear Problem Description**: Users understand what went wrong
- **Actionable Solutions**: Specific steps to resolve the issue
- **Alternative Paths**: Multiple ways to achieve the desired outcome
- **Calm Error Handling**: No blame or frustration in error messaging

---

This wireframe documentation provides comprehensive specifications for implementing the Later app MVP with consistent attention to calm technology principles, accessibility requirements, and responsive design considerations.