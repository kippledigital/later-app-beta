# Later App — High-Level MVP Specification

## Overview
Later is a **second brain / assistant app** designed for effortless capture and delightful engagement with personal content. The core philosophy is *simplicity, non-pushy AI support, and user-driven interaction*. Later is not a task manager or productivity hammer; it’s a calm, always-available companion for collecting, revisiting, and exploring the ideas, notes, links, and inspirations that matter most.

The MVP should prioritize:
- **Frictionless capture** (text, links, notes, emails, events).
- **Simple engagement loops** (read, explore, save, revisit).
- **Lightweight AI assistance** (summaries, categorization, gentle insights).
- **Delightful but minimal design** (not overwhelming, not pushy).

---

## MVP Core Flow

### 1. Registration & Sign-Up
- **Authentication**: Email + password (Supabase auth) or third-party login (Google, Apple).
- **Account setup**: User creates a Later account with basic profile info (name, avatar optional).

### 2. Onboarding Flow
- **Quick intro**: One or two screens explaining Later’s purpose — “Capture anything. Revisit when you want. AI helps organize, but you’re in control.”
- **Share sheet install** (mobile-first MVP): Prompt users to enable Later as a system share target for saving links, highlights, or notes from any app.
- **Optional email forwarding**: Provide a unique Later email address for forwarding emails into Later (MVP+1 candidate).

### 3. Navigation
Persistent bottom navigation bar with three tabs:
- **Now** → Home feed showing “what might need attention” (events, emails, unread saves).
- **Inbox** → Raw queue of captured content, swipe to archive/categorize.
- **Library** → Organized saved content (by tag/category).

Floating action button (FAB) for **Quick Capture** (text, notes, links).

---

## MVP Features

### A. Capture
- **Manual entry**: Quick capture modal with title, notes, link, and optional category (Work, Life, Inspiration).
- **Mobile share sheet**: Save links, articles, or text directly into Later.
- **Tags/categories**: Simple tagging system (Work, Life, Inspiration).
- **Library auto-categorization**: MVP may include lightweight auto-tagging suggestions (AI-assisted).

### B. Inbox
- Raw list of captured items.
- Swipe gestures:
  - **Left** → Archive.
  - **Right** → Categorize (choose tag).
- Bulk actions: Archive, categorize.

### C. Library
- Saved items organized by category.
- Filters (All, Work, Life, Inspiration).
- Rich preview cards (title, snippet, tag, date).
- Ability to revisit and open original content.

### D. Reading Mode
- **Reader overlay** with two modes:
  - **Summary**: AI-generated short summary with key takeaways.
  - **Full**: Original article or captured text.
- **Progress tracking**: Reading progress bar.
- **Interactions**: Bookmark, Save, Done.

### E. Events & Calendar
- Simple event cards (title, date/time, notes).
- “Add to Calendar” button (integrates with native calendar via .ics or API).
- Future: Email/calendar sync.

### F. AI Support (MVP-Level)
- Summarization of articles.
- Suggested tags/categories.
- Gentle context (e.g., “You’re 40% through this article”).
- **Non-pushy**: No overwhelming nudges, just helpful context.

---

## Design Principles
- **Delightful simplicity**: Minimal UI, soft tones, no overload.
- **User in control**: AI assists, but does not dictate.
- **Capture-first**: The core loop is “save now, decide later.”
- **Calm engagement**: No pressure to complete or check off.

---

## Future Opportunities (Beyond MVP)
- **Semantic recall & synthesis**: “Summarize everything I’ve saved about design systems.”
- **Smart email integration**: Forward emails, auto-extract events/tasks.
- **Deeper highlight/bookmarking**: Allow highlighting passages inside saved content.
- **Contextual notifications**: Nudges based on time/context (without being pushy).
- **Cross-platform sync**: Browser extension, desktop app.
- **Community features**: Share collections with friends/teams.
- **Revenue model**: Free tier with storage limit; yearly paid plan for unlimited saves + advanced AI features.

---

## MVP Success Criteria
1. Users can **easily capture** content (via share sheet + quick capture).
2. Users can **revisit and engage** (read summaries, save to library, categorize).
3. The experience feels **light, simple, and helpful**, not overwhelming.
4. Core AI features (summarization, light tagging) enhance — not dominate — the flow.

---
