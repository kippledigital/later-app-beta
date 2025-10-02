---
title: Later App Accessibility Guidelines
description: Comprehensive accessibility standards and implementation requirements for inclusive design
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - ../design-system/tokens/colors.md
  - ../design-system/style-guide.md
  - testing.md
status: draft
---

# Accessibility Guidelines

## Philosophy

Accessibility is not an add-on feature for the Later app—it is a fundamental design principle that ensures our calm technology approach serves **all users**, regardless of their abilities, technologies, or circumstances. Our commitment to accessibility aligns perfectly with our calm technology philosophy: reducing barriers and anxiety while enhancing human capability.

## Core Accessibility Principles

### 1. Universal Design
- **Design for everyone from the start**: Accessibility considerations inform initial design decisions
- **Multiple ways to accomplish tasks**: Provide alternative interaction methods for all core functions
- **Inclusive by default**: Features work for assistive technologies without special modes

### 2. Calm Accessibility
- **Reduce cognitive load**: Clear, predictable interfaces that don't overwhelm
- **Gentle assistance**: Helpful feedback without intrusive or patronizing messaging
- **User control**: Users can customize the interface to meet their specific needs

### 3. Progressive Enhancement
- **Core functionality first**: Essential features work without advanced browser features
- **Enhanced experiences**: Additional features layer on top without breaking core functionality
- **Graceful degradation**: Interface remains usable when assistive technologies aren't available

---

## WCAG 2.1 Compliance Standards

### Level AA Compliance (Minimum)
The Later app meets or exceeds WCAG 2.1 Level AA standards across all features and platforms.

#### Perceivable
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Text Alternatives**: All images, icons, and non-text content have descriptive alternatives
- **Captions**: All video content includes accurate captions
- **Responsive Text**: Text can be resized up to 200% without horizontal scrolling

#### Operable
- **Keyboard Navigation**: All functionality available via keyboard
- **No Seizures**: No content flashes more than 3 times per second
- **Sufficient Time**: Users have enough time to read and interact with content
- **Navigation Help**: Multiple ways to locate content and understand location

#### Understandable
- **Readable Text**: Content is written in clear, simple language
- **Predictable Navigation**: Interface behaves consistently across screens
- **Input Assistance**: Clear labels, instructions, and error messaging
- **Error Prevention**: Helps users avoid and correct mistakes

#### Robust
- **Assistive Technology**: Compatible with current and future assistive technologies
- **Valid Code**: Clean, semantic HTML and proper ARIA implementation
- **Cross-Platform**: Works across devices, browsers, and assistive technologies

### Enhanced Accessibility Targets (AAA)
For critical user interactions, we exceed minimum standards:

#### Enhanced Color Contrast
- **Critical Actions**: 7:1 contrast ratio for primary buttons and important interactive elements
- **Reading Content**: AAA compliance for long-form text in the Reader feature
- **Error States**: Enhanced contrast for error messages and recovery guidance

#### Advanced Keyboard Support
- **Comprehensive Shortcuts**: Keyboard shortcuts for all major application functions
- **Skip Navigation**: Multiple skip links for efficient navigation
- **Focus Management**: Logical, predictable focus order with visual indicators

---

## Platform-Specific Accessibility Requirements

### iOS Accessibility

#### VoiceOver Support
- **Semantic Elements**: All interface elements properly labeled for screen readers
- **Custom Actions**: Swipe actions and complex gestures have VoiceOver alternatives
- **Dynamic Content**: Live regions announce content changes appropriately
- **Navigation**: Clear heading structure and landmark identification

#### iOS Accessibility Features Integration
- **Dynamic Type**: Full support for iOS text size preferences (from 12pt to 53pt)
- **Reduce Motion**: Respects user preference for reduced animation
- **Button Shapes**: Ensures button identification when button shapes are enabled
- **High Contrast**: Interface adapts to iOS high contrast mode
- **Color Filters**: Interface remains usable with color vision accommodations

#### Implementation Requirements
```swift
// VoiceOver label example
saveButton.accessibilityLabel = "Save article to Later inbox"
saveButton.accessibilityHint = "Saves this content to read later"
saveButton.accessibilityTraits = .button

// Dynamic Type support
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true

// Reduce Motion support
if UIAccessibility.isReduceMotionEnabled {
    // Use instant transitions instead of animations
}
```

### Android Accessibility

#### TalkBack Support
- **Content Descriptions**: All UI elements have meaningful content descriptions
- **Custom Gestures**: Alternative interaction methods for swipe and gesture-based features
- **Live Regions**: Announce dynamic content changes appropriately
- **Focus Management**: Proper focus handling during screen transitions

#### Android Accessibility Services Integration
- **Large Text**: Support for Android system font size scaling
- **Color Correction**: Interface works with Android color vision accommodation
- **High Contrast**: Adapts to Android high contrast text settings
- **Switch Control**: Full switch navigation support for motor accessibility

#### Implementation Requirements
```kotlin
// Content description example
saveButton.contentDescription = "Save article to Later inbox"

// Large text support
textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)

// Live region for dynamic content
announcementView.accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
```

### Web Accessibility

#### Screen Reader Support
- **Semantic HTML**: Proper use of heading hierarchy, landmarks, and form structure
- **ARIA Labels**: Comprehensive ARIA labeling for dynamic and custom components
- **Live Regions**: Appropriate announcement of content changes
- **Focus Management**: Programmatic focus handling for single-page application behavior

#### Browser Accessibility Features Integration
- **High Contrast Mode**: CSS supports Windows high contrast mode
- **Reduced Motion**: Respects `prefers-reduced-motion` user preference
- **Color Schemes**: Supports `prefers-color-scheme` for system theme preferences
- **Forced Colors**: Interface adapts to browser/OS forced color modes

#### Implementation Requirements
```html
<!-- Semantic HTML structure -->
<main role="main" aria-label="Content inbox">
  <h1>Your Later Inbox</h1>
  <section aria-label="Unread articles">
    <h2>New Articles (3)</h2>
    <!-- Article list -->
  </section>
</main>

<!-- ARIA live region for status updates -->
<div role="status" aria-live="polite" id="status-announcements">
  Article saved successfully
</div>
```

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border-width: 2px;
    --focus-outline-width: 4px;
  }
}
```

---

## Accessibility-First Design Patterns

### Navigation Accessibility

#### Bottom Tab Navigation
- **Screen Reader Labels**: Each tab clearly labeled with current state
- **Badge Announcements**: Unread counts announced without overwhelming
- **Gesture Alternatives**: Swipe navigation has keyboard/tap alternatives

```typescript
// React Native example
<Tab
  accessibilityLabel="Inbox tab"
  accessibilityState={{ selected: isSelected }}
  accessibilityHint="Shows your saved articles and content"
  badge={unreadCount}
  accessibilityValue={{ text: `${unreadCount} unread items` }}
/>
```

#### Skip Navigation
- **Multiple Skip Links**: Skip to main content, skip to navigation, skip to search
- **Contextual Skipping**: Skip repetitive content in lists and feeds
- **Landmark Navigation**: Clear landmarks for screen reader navigation

### Form Accessibility

#### Input Field Design
- **Clear Labels**: Visible labels that don't disappear on focus
- **Help Text**: Additional guidance without overwhelming
- **Error Messaging**: Clear, actionable error descriptions
- **Success Feedback**: Confirmation of successful form submission

```html
<!-- Accessible form field -->
<label for="article-title">Article Title</label>
<input
  id="article-title"
  type="text"
  aria-describedby="title-help title-error"
  aria-invalid="false"
  required
/>
<div id="title-help">Brief, descriptive title for your saved article</div>
<div id="title-error" aria-live="polite" role="alert">
  <!-- Error message appears here -->
</div>
```

#### Form Validation
- **Real-time Feedback**: Helpful validation without constant interruption
- **Error Prevention**: Guide users toward correct input formats
- **Clear Recovery**: Easy ways to fix errors and continue

### Content Accessibility

#### Article Reader
- **Customizable Typography**: User control over font size, family, and spacing
- **Focus Management**: Logical reading order and bookmark placement
- **Reading Progress**: Accessible progress indicators and estimated time
- **Content Structure**: Clear heading hierarchy and section organization

```css
/* Reader customization variables */
.reader-content {
  font-size: var(--user-font-size, 18px);
  line-height: var(--user-line-height, 1.6);
  font-family: var(--user-font-family, 'Inter', sans-serif);
  color: var(--user-text-color, #1A1A1A);
  background: var(--user-background-color, #FFFFFF);
}
```

#### Content Lists
- **Scannable Structure**: Clear hierarchy and grouping
- **Keyboard Navigation**: Efficient keyboard interaction patterns
- **Batch Actions**: Accessible bulk operations
- **Loading States**: Clear indication of loading progress

### Interaction Accessibility

#### Touch Targets
- **Minimum Size**: 44×44px minimum for all interactive elements
- **Adequate Spacing**: Sufficient space between touch targets
- **Visual Feedback**: Clear indication of touch interaction
- **Alternative Actions**: Multiple ways to perform actions

#### Gesture Alternatives
- **Swipe Actions**: Button alternatives for all swipe gestures
- **Long Press**: Tap alternatives for long press actions
- **Pinch/Zoom**: Button controls for zoom functionality
- **Multi-touch**: Single-touch alternatives for complex gestures

---

## Content Accessibility Guidelines

### Writing for Accessibility

#### Plain Language Principles
- **Clear, Simple Language**: Avoid jargon, complex sentences, and unnecessary words
- **Active Voice**: Use active voice for clearer understanding
- **Consistent Terminology**: Use the same words for the same concepts throughout
- **Logical Structure**: Organize information in predictable, scannable formats

#### Content Structure
- **Descriptive Headings**: Headings that clearly describe the section content
- **Bulleted Lists**: Break up long paragraphs with scannable lists
- **Short Paragraphs**: Keep paragraphs to 3-4 sentences maximum
- **Summary Information**: Provide key takeaways at the beginning of long content

### Image and Media Accessibility

#### Image Descriptions
- **Decorative Images**: Empty alt attributes for purely decorative images
- **Informative Images**: Concise, descriptive alt text that conveys essential information
- **Complex Images**: Detailed descriptions for charts, graphs, and complex visuals
- **Context-Aware**: Alt text that makes sense within the surrounding content

#### Icon Accessibility
- **Meaningful Icons**: Icons paired with text labels or clear context
- **Consistent Meaning**: Same icons used consistently throughout the interface
- **Alternative Text**: Screen reader descriptions for all interactive icons
- **Cultural Considerations**: Icons that translate across different cultural contexts

### Error and Status Messaging

#### Error Communication
- **Clear Problem Description**: Explain what went wrong in simple terms
- **Actionable Solutions**: Specific steps to fix the problem
- **Non-Punitive Language**: Helpful tone that doesn't blame the user
- **Multiple Channels**: Visual, textual, and programmatic error communication

#### Status Updates
- **Progress Indication**: Clear indication of background processes
- **Completion Confirmation**: Confirmation when actions are successfully completed
- **Context Preservation**: Users understand where they are after status changes
- **Gentle Notifications**: Status updates that don't interrupt user focus

---

## Testing and Validation

### Automated Testing

#### Accessibility Auditing Tools
- **axe-core**: Automated accessibility testing for web components
- **Lighthouse**: Google Lighthouse accessibility auditing
- **pa11y**: Command-line accessibility testing
- **React Native Accessibility**: Built-in accessibility testing tools

#### Continuous Integration
- **Automated Tests**: Accessibility tests run on every code commit
- **Regression Testing**: Ensure accessibility improvements don't regress
- **Performance Impact**: Monitor accessibility feature performance impact
- **Cross-Platform Testing**: Validate accessibility across target platforms

### Manual Testing

#### Screen Reader Testing
- **VoiceOver (iOS/macOS)**: Test with VoiceOver on iPhone and Mac
- **TalkBack (Android)**: Test with TalkBack on Android devices
- **NVDA/JAWS (Windows)**: Test with popular Windows screen readers
- **Voice Control**: Test with voice control navigation

#### Keyboard Navigation Testing
- **Tab Order**: Verify logical keyboard navigation order
- **Focus Indicators**: Ensure focus is always visible and clear
- **Keyboard Shortcuts**: Test all application keyboard shortcuts
- **Focus Trapping**: Verify modal and dropdown focus management

#### User Testing with Disabilities
- **Regular User Research**: Include users with disabilities in regular testing
- **Diverse Abilities**: Test with users having different types of disabilities
- **Real-World Scenarios**: Test in environments similar to actual usage
- **Feedback Integration**: Systematically incorporate accessibility feedback

### Accessibility Checklist

#### Design Phase
- [ ] Color contrast ratios meet or exceed WCAG AA standards
- [ ] Interface works without color as the only indicator
- [ ] Touch targets meet minimum size requirements (44×44px)
- [ ] Typography scales appropriately with system font size preferences
- [ ] Focus indicators are clearly visible and consistent
- [ ] Content hierarchy is clear through visual and semantic structure

#### Development Phase
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader labels and descriptions are comprehensive and helpful
- [ ] Form validation provides clear, actionable feedback
- [ ] Error states include recovery guidance
- [ ] Live regions announce dynamic content appropriately
- [ ] Focus management works correctly in single-page application contexts

#### Testing Phase
- [ ] Automated accessibility tests pass on all components
- [ ] Manual screen reader testing completed on target platforms
- [ ] Keyboard navigation tested across all user flows
- [ ] User testing includes participants with disabilities
- [ ] Performance impact of accessibility features is acceptable
- [ ] Cross-platform accessibility consistency verified

---

## Implementation Resources

### Development Tools

#### React Native Accessibility
```typescript
// Accessibility props for React Native components
interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}
```

#### Web Accessibility Utilities
```typescript
// Focus management utilities
export const focusUtils = {
  trapFocus: (container: HTMLElement) => {
    // Implementation for focus trapping in modals
  },
  restoreFocus: (previousElement: HTMLElement) => {
    // Implementation for restoring focus after modal close
  },
  announceToScreenReader: (message: string) => {
    // Implementation for programmatic announcements
  },
};

// Keyboard navigation utilities
export const keyboardUtils = {
  handleArrowNavigation: (event: KeyboardEvent, items: HTMLElement[]) => {
    // Implementation for arrow key navigation in lists
  },
  handleEscapeKey: (event: KeyboardEvent, onEscape: () => void) => {
    // Implementation for escape key handling
  },
};
```

### Design Tools Integration

#### Figma Accessibility Plugins
- **Stark**: Color contrast checking and simulation
- **Able**: Accessibility annotation and documentation
- **A11y Annotation Kit**: Accessibility specification templates

#### Design Token Integration
```json
{
  "accessibility": {
    "minTouchTarget": {
      "value": "44px",
      "type": "sizing"
    },
    "focusOutlineWidth": {
      "value": "2px",
      "type": "borderWidth"
    },
    "contrastRatios": {
      "aa": {
        "value": "4.5",
        "type": "number"
      },
      "aaa": {
        "value": "7",
        "type": "number"
      }
    }
  }
}
```

---

## Maintenance and Evolution

### Accessibility Debt Management
- **Regular Audits**: Quarterly accessibility audits and improvements
- **User Feedback**: Ongoing feedback collection from users with disabilities
- **Technology Updates**: Stay current with assistive technology capabilities
- **Standard Updates**: Monitor and implement new accessibility standards

### Training and Awareness
- **Team Training**: Regular accessibility training for all team members
- **Design Reviews**: Accessibility considerations in all design reviews
- **Code Reviews**: Accessibility checks in all code review processes
- **User Empathy**: Regular experiences using assistive technologies

### Community Engagement
- **Accessibility Community**: Active participation in accessibility communities
- **Open Source**: Contribute accessibility improvements back to open source
- **Documentation**: Share learnings and best practices publicly
- **Feedback Channels**: Clear channels for accessibility feedback and suggestions

---

This accessibility framework ensures that the Later app's calm technology approach serves all users effectively, creating an inclusive experience that reduces barriers and anxiety while enhancing human capability for everyone.