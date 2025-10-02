---
title: Later App Animation & Motion System
description: Comprehensive animation specifications aligned with calm technology principles
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - ../style-guide.md
  - ../../accessibility/guidelines.md
  - ../components/README.md
status: draft
---

# Animation & Motion System

## Philosophy

The Later app animation system embodies **calm technology** principles through purposeful, respectful motion that enhances understanding without demanding attention. Every animation serves a functional purpose: providing feedback, indicating relationships, or guiding user attention in ways that feel natural and unforced.

## Core Animation Principles

### 1. Purposeful Motion
- **Functional First**: Every animation serves a clear purpose in user understanding
- **No Gratuitous Movement**: Animations enhance workflow, never distract from content
- **Contextual Appropriateness**: Motion intensity matches the importance of the interaction
- **Accessibility Awareness**: All animations respect user preferences for reduced motion

### 2. Natural Physics
- **Real-World Inspiration**: Motion feels grounded in familiar physical behaviors
- **Organic Timing**: Animations start slow, accelerate naturally, then ease to completion
- **Realistic Interactions**: Elements respond to user input with believable physics
- **Gentle Feedback**: Confirmations and state changes feel satisfying but not overwhelming

### 3. Respectful Timing
- **Patient Rhythm**: Animations don't rush users or create pressure
- **Interruptible Motion**: Users can interrupt animations without breaking the interface
- **Efficient Performance**: 60fps target with graceful degradation on slower devices
- **Battery Conscious**: Minimal impact on device battery life

### 4. Calm Aesthetics
- **Subtle Movement**: Animations are noticeable but not attention-grabbing
- **Smooth Transitions**: Seamless state changes that don't jar or surprise
- **Consistent Language**: Similar interactions use similar motion patterns
- **Reduced Anxiety**: Motion calms rather than excites or overwhelms

---

## Timing & Easing System

### Timing Functions

#### Natural Easing Curves
```css
/* Calm technology easing functions */
:root {
  /* Primary easing for most interactions */
  --ease-out-gentle: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-calm: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-soft: cubic-bezier(0.32, 0, 0.67, 0);

  /* Specialized easing for specific contexts */
  --ease-bounce-subtle: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-anticipation: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring-light: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

#### Easing Function Applications

**Ease Out Gentle** (`cubic-bezier(0.16, 1, 0.3, 1)`)
- **Use Cases**: Content appearing, modal entrances, card expansions
- **Characteristics**: Quick start, smooth completion, feels effortless
- **User Experience**: Content gracefully comes into view

**Ease In-Out Calm** (`cubic-bezier(0.4, 0, 0.2, 1)`)
- **Use Cases**: Page transitions, tab switching, content sliding
- **Characteristics**: Smooth acceleration and deceleration
- **User Experience**: Balanced motion that feels controlled

**Ease In Soft** (`cubic-bezier(0.32, 0, 0.67, 0)`)
- **Use Cases**: Content disappearing, modal exits, element removal
- **Characteristics**: Gradual start, accelerating completion
- **User Experience**: Elements gracefully fade away

### Duration Scale

#### Micro Interactions (50-200ms)
```css
:root {
  --duration-instant: 50ms;   /* Button press feedback */
  --duration-quick: 100ms;    /* Hover state changes */
  --duration-snap: 150ms;     /* Icon state changes */
  --duration-fast: 200ms;     /* Color transitions */
}
```

**Applications**:
- **Button Press Feedback**: Immediate visual response to touch
- **Hover States**: Color and shadow changes on desktop
- **Icon Animations**: Check marks, loading spinners, state icons
- **Color Transitions**: Background color changes, text color shifts

#### Local Transitions (250-400ms)
```css
:root {
  --duration-short: 250ms;    /* Card animations */
  --duration-standard: 300ms; /* Modal appearances */
  --duration-comfortable: 400ms; /* Drawer slides */
}
```

**Applications**:
- **Card Interactions**: Expansion, selection, rearrangement
- **Modal Dialogs**: Appearance and dismissal of overlays
- **Drawer Navigation**: Side panel slides and reveals
- **Form Feedback**: Validation states and error messages

#### Global Transitions (500-800ms)
```css
:root {
  --duration-deliberate: 500ms;   /* Screen transitions */
  --duration-storytelling: 650ms; /* Onboarding flows */
  --duration-cinematic: 800ms;    /* Special moments */
}
```

**Applications**:
- **Screen Transitions**: Between major app sections
- **Onboarding Sequences**: Progressive feature introduction
- **Achievement Moments**: Completion celebrations, milestones
- **Complex State Changes**: Multi-step processes

---

## Animation Patterns

### Content Entrance Animations

#### Fade In Pattern
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.content-enter {
  animation: fadeIn var(--duration-standard) var(--ease-out-gentle);
}
```

**Use Cases**:
- Article content loading in reader mode
- Search results appearing after query
- AI summaries appearing after processing
- Gentle content reveals that don't startle

#### Slide Up Entrance
```css
@keyframes slideUpEnter {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter {
  animation: slideUpEnter var(--duration-comfortable) var(--ease-out-gentle);
}
```

**Use Cases**:
- Modal dialog appearances
- Bottom sheet presentations
- Content cards appearing in lists
- Contextual action sheets

#### Scale In Pattern
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popover-enter {
  animation: scaleIn var(--duration-short) var(--ease-out-gentle);
}
```

**Use Cases**:
- Tooltip appearances
- Dropdown menu reveals
- Quick action button expansions
- Contextual information displays

### Content Exit Animations

#### Fade Out Pattern
```css
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.content-exit {
  animation: fadeOut var(--duration-fast) var(--ease-in-soft);
}
```

**Use Cases**:
- Content removal after archiving
- Temporary message dismissals
- Background content when modal appears
- Gentle content hiding

#### Slide Down Exit
```css
@keyframes slideDownExit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(16px);
  }
}

.modal-exit {
  animation: slideDownExit var(--duration-short) var(--ease-in-soft);
}
```

**Use Cases**:
- Modal dialog dismissals
- Bottom sheet closures
- Temporary notifications
- Contextual menu closures

### State Change Animations

#### Color Transition
```css
.button-transition {
  transition:
    background-color var(--duration-quick) var(--ease-in-out-calm),
    border-color var(--duration-quick) var(--ease-in-out-calm),
    color var(--duration-quick) var(--ease-in-out-calm);
}

.button-transition:hover {
  background-color: var(--color-primary-light);
}

.button-transition:active {
  background-color: var(--color-primary-dark);
  transition-duration: var(--duration-instant);
}
```

**Use Cases**:
- Button state changes (hover, active, disabled)
- Form field focus states
- Navigation item selections
- Content categorization changes

#### Loading State Animation
```css
@keyframes pulseGentle {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.loading-pulse {
  animation: pulseGentle 2s var(--ease-in-out-calm) infinite;
}
```

**Use Cases**:
- Content loading placeholders
- AI processing indicators
- Background sync status
- Network activity indication

#### Progress Animation
```css
@keyframes progressFill {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
  to {
    transform: scaleX(var(--progress-value));
    transform-origin: left;
  }
}

.progress-bar {
  transition: transform var(--duration-comfortable) var(--ease-out-gentle);
}
```

**Use Cases**:
- Reading progress indicators
- Content upload progress
- AI processing completion
- Goal achievement visualization

### Interactive Feedback Animations

#### Button Press Feedback
```css
.button-press {
  transition: transform var(--duration-instant) var(--ease-in-out-calm);
}

.button-press:active {
  transform: scale(0.98);
}
```

**Use Cases**:
- Immediate touch feedback
- Confirmation of user interaction
- Tactile response simulation
- Action acknowledgment

#### Card Hover Enhancement
```css
.content-card {
  transition:
    transform var(--duration-quick) var(--ease-out-gentle),
    box-shadow var(--duration-quick) var(--ease-out-gentle);
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

**Use Cases**:
- Content card hover states (desktop)
- Interactive element emphasis
- Subtle depth indication
- Engagement invitation

### Gesture-Based Animations

#### Swipe Action Reveal
```css
@keyframes swipeReveal {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.swipe-action {
  animation: swipeReveal var(--duration-short) var(--ease-out-gentle);
}
```

**Use Cases**:
- Swipe-to-archive action revelation
- Quick action button appearances
- Contextual menu reveals
- Progressive disclosure of options

#### Pull-to-Refresh Animation
```css
@keyframes refreshSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.refresh-indicator {
  animation: refreshSpin 1s linear infinite;
}
```

**Use Cases**:
- Content refresh indicators
- Sync status communication
- User-initiated data updates
- Background process indication

---

## Context-Aware Animation Adaptations

### Reduced Motion Support

#### Accessibility-First Implementation
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Maintain essential motion for functionality */
  .progress-essential,
  .loading-essential {
    animation-duration: 0.5s !important;
    transition-duration: 0.3s !important;
  }
}
```

#### Alternative Feedback Methods
When animations are reduced, provide alternative feedback:
- **Instant State Changes**: Immediate visual updates instead of transitions
- **Color-Based Feedback**: Strong color changes to indicate state
- **Text-Based Confirmation**: Clear textual feedback for actions
- **Spatial Relationship**: Layout changes that clarify relationships

### Performance-Conscious Animation

#### Hardware Acceleration
```css
/* Optimize for performance */
.animate-transform {
  will-change: transform;
  transform: translateZ(0); /* Force hardware acceleration */
}

.animate-opacity {
  will-change: opacity;
}

/* Clean up after animation */
.animation-complete {
  will-change: auto;
}
```

#### Battery-Conscious Patterns
- **Finite Animations**: Most animations complete and stop
- **Reduced Background Motion**: Minimal continuous animations
- **Context-Aware Intensity**: Reduce animation intensity on low battery
- **Efficient Triggers**: Only animate when visible and necessary

### Device-Specific Adaptations

#### Mobile-Optimized Motion
```css
/* Mobile-specific timing adjustments */
@media (max-width: 768px) {
  :root {
    --duration-quick: 150ms;    /* Slightly longer for touch */
    --duration-standard: 350ms; /* More comfortable on mobile */
    --duration-comfortable: 450ms; /* Account for slower touch response */
  }
}
```

#### High-Refresh Rate Support
```css
/* Enhanced animations for high-refresh displays */
@media (min-resolution: 120dpi) {
  .smooth-animation {
    animation-timing-function: var(--ease-spring-light);
  }
}
```

---

## Component-Specific Animation Guidelines

### Navigation Animations

#### Tab Switching
```css
.tab-content-enter {
  opacity: 0;
  transform: translateX(24px);
  animation: slideInTab var(--duration-standard) var(--ease-out-gentle);
}

@keyframes slideInTab {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

#### Modal Presentations
```css
.modal-backdrop {
  opacity: 0;
  animation: backdropFade var(--duration-standard) var(--ease-out-gentle);
}

.modal-content {
  transform: translateY(100%);
  animation: modalSlideUp var(--duration-comfortable) var(--ease-out-gentle);
}

@keyframes backdropFade {
  to { opacity: 0.6; }
}

@keyframes modalSlideUp {
  to { transform: translateY(0); }
}
```

### Content Animations

#### Article Loading
```css
.article-enter {
  opacity: 0;
  transform: translateY(16px);
  animation: articleAppear var(--duration-comfortable) var(--ease-out-gentle);
}

@keyframes articleAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### List Item Animations
```css
.list-item-enter {
  opacity: 0;
  transform: translateY(8px);
  animation: listItemStagger var(--duration-short) var(--ease-out-gentle);
}

/* Staggered entrance for multiple items */
.list-item-enter:nth-child(1) { animation-delay: 0ms; }
.list-item-enter:nth-child(2) { animation-delay: 50ms; }
.list-item-enter:nth-child(3) { animation-delay: 100ms; }
.list-item-enter:nth-child(4) { animation-delay: 150ms; }
```

### Form Animations

#### Validation Feedback
```css
.input-error {
  animation: gentleShake var(--duration-short) var(--ease-in-out-calm);
  border-color: var(--color-error);
}

@keyframes gentleShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
```

#### Success Confirmation
```css
.form-success {
  animation: successPulse var(--duration-comfortable) var(--ease-out-gentle);
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

---

## React Native Animation Implementation

### Animated API Usage

#### Basic Transition
```typescript
import { Animated, Easing } from 'react-native';

const FadeInComponent = () => {
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Content */}
    </Animated.View>
  );
};
```

#### Gesture-Based Animation
```typescript
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const SwipeCard = () => {
  const translateX = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > 100) {
        // Complete the swipe
        translateX.value = withSpring(
          event.translationX > 0 ? 300 : -300,
          { damping: 20, stiffness: 300 }
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        {/* Card content */}
      </Animated.View>
    </PanGestureHandler>
  );
};
```

---

## Animation Testing & Quality Assurance

### Performance Testing

#### Frame Rate Monitoring
```typescript
// React Native performance monitoring
import { Performance } from 'react-native-performance';

Performance.mark('animation-start');
// Animation code
Performance.mark('animation-end');
Performance.measure('animation-duration', 'animation-start', 'animation-end');
```

#### Animation Auditing Checklist
- [ ] All animations maintain 60fps on target devices
- [ ] No animation interferes with content readability
- [ ] Reduced motion preferences are respected
- [ ] Battery impact is minimal during extended use
- [ ] Animations gracefully degrade on slower devices

### Accessibility Testing

#### Motion Sensitivity Validation
- [ ] All essential information is conveyed without relying on motion
- [ ] Alternative feedback methods work when animations are disabled
- [ ] No animations trigger vestibular disorders or motion sickness
- [ ] Users can complete all tasks with animations disabled

### User Experience Validation

#### Calm Technology Assessment
- [ ] Animations feel helpful rather than attention-grabbing
- [ ] Motion timing feels patient and unrushed
- [ ] Users can interrupt animations without breaking interface
- [ ] Overall experience feels calming and supportive

---

This animation system provides the foundation for creating motion that enhances the Later app experience while maintaining strict adherence to calm technology principles and accessibility requirements.