# Later App — Technical Architecture Blueprint

## Executive Summary

### Project Overview
Later is a context-aware content management platform designed as "calm technology" that helps users capture, organize, and intelligently surface content at contextually appropriate moments. The system combines AI-powered content processing with privacy-first context detection to create a mindful alternative to traditional productivity tools.

### Key Architectural Decisions
- **Mobile-First Architecture**: Expo/React Native for cross-platform mobile experience with TypeScript
- **Technology Stack**: Supabase backend (Postgres + Auth + Storage + Edge Functions), Expo/React Native frontend, Vercel for API hosting
- **Integrated Backend Services**: Leverage Supabase's unified platform for auth, database, storage, and real-time features
- **AI Service Abstraction**: OpenAI integration with multi-provider capability to avoid vendor lock-in
- **Privacy-First Design**: Supabase RLS (Row Level Security) with user-controlled data retention
- **Offline-First Mobile**: Expo SecureStore for local data with sync capabilities
- **Calm Technology Principles**: No aggressive polling, gentle notifications, respect for user attention

### System Component Overview
1. **Mobile App (Expo/React Native)**: Primary user interface with offline-first capabilities
2. **Supabase Backend**: Postgres database, authentication, storage, and real-time subscriptions
3. **Edge Functions (Supabase)**: AI processing, content extraction, and background tasks
4. **Vercel API Layer**: Additional serverless functions and web app hosting
5. **Content Capture Pipeline**: Multi-source ingestion via mobile sensors and sharing
6. **AI Processing Engine**: OpenAI integration for summarization and categorization
7. **Context Detection Service**: Device-based location and calendar integration
8. **Offline Storage Layer**: Expo SecureStore with background sync capabilities

### Critical Technical Constraints
- Support 10,000 concurrent users by Year 1
- App launch time <3 seconds, content capture <5 seconds
- AI processing completed within 30 seconds via Edge Functions
- Offline reading capability with local content storage
- GDPR/CCPA compliance with Supabase RLS and 99.9% data durability
- Cross-platform mobile (iOS/Android) with optional web companion
- Native mobile features: camera, sharing, background sync, biometric auth

---

## For Backend Engineers

### API Endpoint Specifications

#### Authentication Endpoints

**POST /auth/register**
```typescript
Request: {
  email: string;
  password?: string; // Optional for OAuth
  provider?: 'google' | 'apple' | 'microsoft';
  name: string;
  timezone: string;
}

Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

**POST /auth/login**
```typescript
Request: {
  email: string;
  password?: string;
  provider?: string;
  oauthToken?: string;
}

Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### Content Management Endpoints

**POST /content/capture**
```typescript
Request: {
  url?: string;
  text?: string;
  title?: string;
  source: 'web' | 'email' | 'voice' | 'screenshot' | 'manual';
  metadata?: {
    originalSource?: string;
    captureMethod?: string;
    deviceContext?: string;
  };
}

Response: {
  id: string;
  status: 'processing' | 'ready' | 'failed';
  estimatedProcessingTime: number;
}
```

**GET /content/inbox**
```typescript
Query Parameters: {
  limit?: number = 20;
  offset?: number = 0;
  status?: 'unprocessed' | 'processed' | 'all';
}

Response: {
  items: ContentItem[];
  total: number;
  hasMore: boolean;
}
```

**PATCH /content/{id}/categorize**
```typescript
Request: {
  action: 'read_later' | 'listen_later' | 'archive' | 'delete';
  tags?: string[];
  collection?: string;
}

Response: {
  success: boolean;
  item: ContentItem;
}
```

#### Context and Recommendations

**GET /recommendations/now**
```typescript
Query Parameters: {
  context?: 'commute' | 'break' | 'focus_time' | 'evening';
  limit?: number = 5;
}

Response: {
  context: DetectedContext;
  recommendations: ContentRecommendation[];
  reasoning: string[];
}
```

**POST /context/update**
```typescript
Request: {
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  calendar?: CalendarEvent[];
  deviceContext?: {
    type: 'mobile' | 'desktop' | 'tablet';
    timeAvailable?: number; // minutes
  };
}

Response: {
  contextId: string;
  suggestedContent: ContentItem[];
}
```

#### Library and Search

**GET /library/search**
```typescript
Query Parameters: {
  q: string;
  filters?: {
    type?: 'article' | 'video' | 'podcast' | 'document';
    tags?: string[];
    dateRange?: { start: string; end: string; };
    readStatus?: 'unread' | 'reading' | 'completed';
  };
  sort?: 'relevance' | 'date' | 'readTime';
  limit?: number = 20;
  offset?: number = 0;
}

Response: {
  results: SearchResult[];
  total: number;
  facets: SearchFacets;
  suggestions?: string[];
}
```

### Supabase Edge Functions

Edge Functions handle AI processing, background tasks, and complex business logic:

#### Content Processing Function
```typescript
// functions/process-content/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const { contentId } = await req.json()

  try {
    // Get content item
    const { data: content, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentId)
      .single()

    if (error) throw error

    // Extract text content if URL provided
    let extractedText = content.text
    if (content.url && !extractedText) {
      // Use web scraping service or readability API
      extractedText = await extractContentFromUrl(content.url)
    }

    // AI processing for summarization and categorization
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'Analyze this content and provide a summary, estimated read time, and suggest 3-5 relevant tags.'
      }, {
        role: 'user',
        content: extractedText || content.title || ''
      }],
      functions: [{
        name: 'process_content',
        parameters: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            estimated_read_time: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
            content_type: { type: 'string', enum: ['article', 'video', 'podcast', 'document'] }
          }
        }
      }],
      function_call: { name: 'process_content' }
    })

    const result = JSON.parse(completion.choices[0].message.function_call?.arguments || '{}')

    // Update content item
    await supabase
      .from('content_items')
      .update({
        summary: result.summary,
        estimated_read_time: result.estimated_read_time,
        content_type: result.content_type,
        extracted_text: extractedText,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', contentId)

    // Add tags
    if (result.tags?.length) {
      await addTagsToContent(contentId, result.tags)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

#### Recommendations Function
```typescript
// functions/get-recommendations/index.ts
serve(async (req) => {
  const { userId, context, limit = 5 } = await req.json()

  try {
    // Get user context
    const { data: userContext } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    // Get unread content
    const { data: content } = await supabase
      .from('content_items')
      .select(`
        *,
        content_tags (tags (name))
      `)
      .eq('user_id', userId)
      .eq('read_status', 'unread')
      .eq('status', 'processed')
      .limit(20)

    // AI-powered recommendation logic
    const recommendations = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: `Recommend content based on user context. Context: ${JSON.stringify(userContext)}. Return array of content IDs ranked by relevance.`
      }, {
        role: 'user',
        content: JSON.stringify(content)
      }]
    })

    return new Response(JSON.stringify({
      recommendations: recommendations.choices[0].message.content,
      context: userContext
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Database Schema Design

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for OAuth users
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_at);
```

#### Content Items Table
```sql
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  text TEXT,
  html TEXT,
  summary TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'podcast', 'document'
  source VARCHAR(100) NOT NULL,
  capture_method VARCHAR(50) NOT NULL,
  word_count INTEGER,
  estimated_read_time INTEGER, -- minutes
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'processing',
  read_status VARCHAR(50) DEFAULT 'unread', -- 'unread', 'reading', 'completed'
  read_progress DECIMAL(5,2) DEFAULT 0.0,
  ai_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP,

  -- Offline support
  offline_downloaded BOOLEAN DEFAULT FALSE,
  offline_path TEXT,

  -- Full-text search vector
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(text, '')), 'C')
  ) STORED
);

-- Enable Row Level Security
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own content" ON public.content_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON public.content_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON public.content_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON public.content_items
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_content_user_id ON public.content_items(user_id);
CREATE INDEX idx_content_status ON public.content_items(status);
CREATE INDEX idx_content_read_status ON public.content_items(read_status);
CREATE INDEX idx_content_created_at ON public.content_items(created_at DESC);
CREATE INDEX idx_content_search ON public.content_items USING GIN(search_vector);
CREATE INDEX idx_content_offline ON public.content_items(offline_downloaded) WHERE offline_downloaded = true;
```

#### Tags and Tagging System
```sql
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- hex color
  created_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.content_tags (
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (content_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_tags
CREATE POLICY "Users can view their content tags" ON public.content_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content_items
      WHERE id = content_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their content tags" ON public.content_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.content_items
      WHERE id = content_id AND user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_usage ON public.tags(usage_count DESC);
CREATE INDEX idx_content_tags_content ON public.content_tags(content_id);
CREATE INDEX idx_content_tags_tag ON public.content_tags(tag_id);
```

#### Reading Sessions and Progress
```sql
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0.0,
  reading_mode VARCHAR(20) DEFAULT 'visual', -- 'visual', 'audio'
  device_type VARCHAR(50),
  context_data JSONB,
  sync_status VARCHAR(20) DEFAULT 'synced' -- 'pending', 'synced', 'failed'
);

-- Enable Row Level Security
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reading sessions" ON public.reading_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" ON public.reading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_reading_sessions_user_content ON public.reading_sessions(user_id, content_id);
CREATE INDEX idx_reading_sessions_started_at ON public.reading_sessions(started_at DESC);
CREATE INDEX idx_reading_sessions_sync ON public.reading_sessions(sync_status) WHERE sync_status != 'synced';
```

#### Context Detection Data
```sql
CREATE TABLE public.user_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_at TIMESTAMP DEFAULT NOW(),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_accuracy INTEGER,
  device_type VARCHAR(50),
  network_type VARCHAR(50),
  battery_level INTEGER,
  time_available_minutes INTEGER,
  calendar_events JSONB,
  ambient_light VARCHAR(20), -- 'bright', 'dim', 'dark'
  motion_state VARCHAR(20), -- 'stationary', 'walking', 'driving'
  suggested_content_types TEXT[],
  context_confidence DECIMAL(3,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own context" ON public.user_contexts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own context" ON public.user_contexts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context" ON public.user_contexts
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_contexts_user_id ON public.user_contexts(user_id);
CREATE INDEX idx_user_contexts_detected_at ON public.user_contexts(detected_at DESC);
CREATE INDEX idx_user_contexts_location ON public.user_contexts USING GIST (
  ll_to_earth(location_lat, location_lng)
) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
```

#### Offline Sync and Storage
```sql
-- Table for tracking offline sync operations
CREATE TABLE public.sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'synced', 'failed'
);

-- Enable Row Level Security
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sync operations" ON public.sync_operations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync operations" ON public.sync_operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync operations" ON public.sync_operations
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sync_operations_user_id ON public.sync_operations(user_id);
CREATE INDEX idx_sync_operations_status ON public.sync_operations(status) WHERE status != 'synced';
CREATE INDEX idx_sync_operations_created_at ON public.sync_operations(created_at DESC);

-- Real-time subscriptions setup
-- Enable real-time for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_contexts;
```

### Business Logic Organization Patterns

#### Service Layer Architecture
```typescript
// Core service interfaces
interface ContentService {
  captureContent(data: CaptureRequest): Promise<ContentItem>;
  processContent(id: string): Promise<ProcessingResult>;
  searchContent(userId: string, query: SearchQuery): Promise<SearchResult>;
}

interface AIService {
  summarizeContent(content: string): Promise<Summary>;
  classifyContent(content: string): Promise<Classification>;
  generateTags(content: string): Promise<string[]>;
}

interface ContextService {
  detectContext(userId: string, signals: ContextSignals): Promise<Context>;
  getRecommendations(userId: string, context: Context): Promise<Recommendation[]>;
}

interface NotificationService {
  scheduleGentleReminder(userId: string, content: ContentItem, timing: ContextualTiming): Promise<void>;
  sendContextualSuggestion(userId: string, recommendations: Recommendation[]): Promise<void>;
}
```

#### Domain Model Organization
```
src/
├── domains/
│   ├── user/
│   │   ├── user.entity.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   └── user.controller.ts
│   ├── content/
│   │   ├── content.entity.ts
│   │   ├── content.service.ts
│   │   ├── capture.service.ts
│   │   └── content.controller.ts
│   ├── ai/
│   │   ├── ai.service.ts
│   │   ├── summarization.service.ts
│   │   └── classification.service.ts
│   ├── context/
│   │   ├── context.service.ts
│   │   ├── detection.service.ts
│   │   └── recommendation.service.ts
│   └── notification/
│       ├── notification.service.ts
│       └── scheduling.service.ts
├── shared/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   └── monitoring/
└── infrastructure/
    ├── ai-providers/
    ├── email/
    ├── calendar/
    └── storage/
```

### Authentication and Authorization Implementation

#### JWT Token Strategy
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'premium';
  permissions: string[];
  iat: number;
  exp: number;
}

// Token validation middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

#### Rate Limiting Strategy
```typescript
// Implement gentle rate limiting aligned with calm technology principles
const rateLimits = {
  'content.capture': { requests: 100, window: '1h', burst: 10 },
  'ai.summarize': { requests: 50, window: '1h', burst: 5 },
  'recommendations.fetch': { requests: 200, window: '1h', burst: 20 },
  'search.query': { requests: 500, window: '1h', burst: 50 }
};
```

### Error Handling and Validation Strategies

#### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Standard error codes
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  CONTENT_EXTRACTION_FAILED = 'CONTENT_EXTRACTION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONTEXT_DETECTION_FAILED = 'CONTEXT_DETECTION_FAILED'
}
```

#### Input Validation Schemas
```typescript
import Joi from 'joi';

const captureContentSchema = Joi.object({
  url: Joi.string().uri().when('source', { is: 'web', then: Joi.required() }),
  text: Joi.string().min(10).max(100000),
  title: Joi.string().min(1).max(500),
  source: Joi.string().valid('web', 'email', 'voice', 'screenshot', 'manual').required(),
  metadata: Joi.object().optional()
});
```

---

## For Frontend Engineers

### Component Architecture and State Management

#### Application Architecture
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── features/        # Feature-specific components
│   │   ├── inbox/
│   │   ├── reader/
│   │   ├── library/
│   │   └── now/
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
├── services/            # API service layer
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

#### State Management with Zustand
```typescript
// stores/authStore.ts - Authentication store
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../services/supabase'

interface AuthStore {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signUp: (email: string, password: string, metadata: any) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const useAuthStore = create<AuthStore>()(persist(
  (set, get) => ({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,

    signIn: async (email, password) => {
      set({ isLoading: true })
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        set({
          user: data.user,
          session: data.session,
          isAuthenticated: true
        })
      } catch (error) {
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    signInWithOAuth: async (provider) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'later://auth/callback'
        }
      })
      if (error) throw error
    },

    signOut: async () => {
      await supabase.auth.signOut()
      set({ user: null, session: null, isAuthenticated: false })
    }
  }),
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => ({
      getItem: async (name) => {
        return await SecureStore.getItemAsync(name)
      },
      setItem: async (name, value) => {
        await SecureStore.setItemAsync(name, value)
      },
      removeItem: async (name) => {
        await SecureStore.deleteItemAsync(name)
      }
    }))
  }
))

// stores/contentStore.ts - Content management store
interface ContentStore {
  inbox: ContentItem[]
  library: ContentItem[]
  currentContent: ContentItem | null
  recommendations: ContentItem[]
  isLoading: boolean
  filters: {
    status: 'all' | 'unread' | 'reading' | 'completed'
    type: 'all' | 'article' | 'video' | 'podcast'
    timeRange: 'all' | 'today' | 'week' | 'month'
  }

  // Actions
  fetchInbox: () => Promise<void>
  captureContent: (data: CaptureData) => Promise<void>
  updateReadingProgress: (contentId: string, progress: number) => Promise<void>
  markAsRead: (contentId: string) => Promise<void>
  deleteContent: (contentId: string) => Promise<void>
  syncOfflineChanges: () => Promise<void>
}

const useContentStore = create<ContentStore>()(persist(
  (set, get) => ({
    inbox: [],
    library: [],
    currentContent: null,
    recommendations: [],
    isLoading: false,
    filters: {
      status: 'all',
      type: 'all',
      timeRange: 'all'
    },

    fetchInbox: async () => {
      set({ isLoading: true })
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('read_status', 'unread')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        set({ inbox: data || [] })
      } catch (error) {
        console.error('Failed to fetch inbox:', error)
      } finally {
        set({ isLoading: false })
      }
    },

    captureContent: async (data) => {
      const { data: newContent, error } = await supabase
        .from('content_items')
        .insert(data)
        .select()
        .single()

      if (error) throw error

      // Add to inbox optimistically
      set(state => ({
        inbox: [newContent, ...state.inbox]
      }))

      // Trigger AI processing
      await supabase.functions.invoke('process-content', {
        body: { contentId: newContent.id }
      })
    }
  }),
  {
    name: 'content-storage',
    storage: createJSONStorage(() => ({
      getItem: async (name) => await SecureStore.getItemAsync(name),
      setItem: async (name, value) => await SecureStore.setItemAsync(name, value),
      removeItem: async (name) => await SecureStore.deleteItemAsync(name)
    }))
  }
))
```

#### Device Integration and Native Features
```typescript
// services/camera.ts - Camera and image processing
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Camera } from 'expo-camera'

export const cameraService = {
  async requestPermissions() {
    const { status } = await Camera.requestCameraPermissionsAsync()
    return status === 'granted'
  },

  async captureImage(quality: number = 0.8) {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality,
      base64: true
    })

    if (!result.canceled) {
      return result.assets[0]
    }
    return null
  },

  async processImage(uri: string) {
    // Optimize image for content extraction
    const processed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )

    return processed
  }
}

// services/sharing.ts - Cross-app sharing integration
import * as Sharing from 'expo-sharing'
import * as Linking from 'expo-linking'

export const sharingService = {
  async handleIncomingShare(url: string) {
    // Parse shared URL and capture content
    const contentData = {
      url,
      source: 'sharing',
      capture_method: 'share_intent',
      metadata: {
        shared_at: new Date().toISOString()
      }
    }

    return await useContentStore.getState().captureContent(contentData)
  },

  async shareContent(content: ContentItem) {
    const shareUrl = `${content.url || content.title}`
    await Sharing.shareAsync(shareUrl, {
      mimeType: 'text/plain',
      dialogTitle: 'Share via Later'
    })
  }
}

// services/sensors.ts - Device sensors for context detection
import * as Location from 'expo-location'
import * as Calendar from 'expo-calendar'
import * as Battery from 'expo-battery'
import { Accelerometer } from 'expo-sensors'

export const sensorService = {
  async getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    }
  },

  async getCalendarEvents() {
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return []

    const calendars = await Calendar.getCalendarsAsync()
    const now = new Date()
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000) // Next 4 hours

    const events = await Calendar.getEventsAsync(
      calendars.map(cal => cal.id),
      now,
      endTime
    )

    return events
  },

  async detectMotionState() {
    return new Promise((resolve) => {
      const subscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z)

        let motionState = 'stationary'
        if (acceleration > 1.2) motionState = 'walking'
        if (acceleration > 2.0) motionState = 'driving'

        subscription.remove()
        resolve(motionState)
      })

      Accelerometer.setUpdateInterval(1000)

      // Timeout after 3 seconds
      setTimeout(() => {
        subscription.remove()
        resolve('stationary')
      }, 3000)
    })
  },

  async getBatteryLevel() {
    return await Battery.getBatteryLevelAsync()
  }
}
```

#### Navigation with Expo Router
```typescript
// app/_layout.tsx - Root layout with authentication
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../services/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.message?.includes('JWT')) return false
        return failureCount < 3
      }
    }
  }
})

export default function RootLayout() {
  const { isAuthenticated, user, setUser } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Redirect based on auth state
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/inbox')
    }
  }, [isAuthenticated, segments])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Slot />
    </QueryClientProvider>
  )
}

// app/(tabs)/_layout.tsx - Tab navigation
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#007AFF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff'
        }
      }}
    >
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'mail' : 'mail-outline'}
              size={24}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="now"
        options={{
          title: 'Now',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={24}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={24}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          )
        }}
      />
    </Tabs>
  )
}

// Deep linking configuration
// app.config.js linking setup
export const linking = {
  prefixes: ['later://', 'https://later.app'],
  config: {
    screens: {
      '(auth)': {
        screens: {
          login: 'login',
          signup: 'signup',
          callback: 'auth/callback'
        }
      },
      '(tabs)': {
        screens: {
          inbox: 'inbox',
          now: 'now',
          library: 'library',
          profile: 'profile'
        }
      },
      reader: 'read/:contentId',
      capture: 'capture',
      share: 'share'
    }
  }
}
```

### Mobile Performance Optimization

#### Offline-First Data Management
```typescript
// hooks/useOfflineSync.ts - Offline sync management
import { useEffect, useState } from 'react'
import NetInfo from '@react-native-async-storage/async-storage'
import { useOfflineStore } from '../stores/offlineStore'
import { useContentStore } from '../stores/contentStore'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const { syncWhenOnline, addPendingOperation } = useOfflineStore()
  const { syncOfflineChanges } = useContentStore()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable
      setIsOnline(online)

      if (online) {
        // Sync pending operations when coming back online
        syncWhenOnline()
        syncOfflineChanges()
      }
    })

    return unsubscribe
  }, [])

  return {
    isOnline,
    queueOfflineOperation: addPendingOperation
  }
}

#### Image and Media Optimization
```typescript
// utils/imageOptimization.ts
import * as ImageManipulator from 'expo-image-manipulator'
import { Image } from 'expo-image'

export const imageOptimization = {
  async optimizeForUpload(uri: string) {
    // Compress and resize images before upload
    const optimized = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 1080 } }, // Max width for content images
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG
      }
    )

    return optimized
  },

  async generateThumbnail(uri: string) {
    const thumbnail = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 300, height: 200 } }
      ],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG
      }
    )

    return thumbnail
  }
}

// Optimized image component with caching
function OptimizedImage({ source, style, placeholder }) {
  return (
    <Image
      source={source}
      style={style}
      placeholder={placeholder}
      transition={200}
      cachePolicy="memory-disk"
      recycleKey={source.uri}
    />
  )
}
```

#### Memory and Performance Management
```typescript
// hooks/useMemoryOptimization.ts
import { useEffect, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useContentStore } from '../stores/contentStore'

export function useMemoryOptimization() {
  const { clearCache, preloadEssentialData } = useContentStore()

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // Clear non-essential cached data when app goes to background
      clearCache()
    } else if (nextAppState === 'active') {
      // Preload essential data when app becomes active
      preloadEssentialData()
    }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription?.remove()
  }, [handleAppStateChange])
}

// Performance monitoring
import { PerformanceObserver } from 'react-native-performance'

export function usePerformanceMonitoring() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 100) {
          console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`)
        }
      })
    })

    observer.observe({ entryTypes: ['measure'] })

    return () => observer.disconnect()
  }, [])
}

// List performance optimization
import { FlashList } from '@shopify/flash-list'

function OptimizedContentList({ data, renderItem }) {
  const getItemType = useCallback((item) => {
    return item.content_type || 'default'
  }, [])

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      estimatedItemSize={100}
      getItemType={getItemType}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  )
}
```

### Build and Development Setup

#### Vite Configuration
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@services': resolve(__dirname, 'src/services'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
  },
});
```

---

## For QA Engineers

### Testable Component Boundaries

#### API Integration Testing
```typescript
// Test content capture flow
describe('Content Capture Flow', () => {
  test('should capture web article successfully', async () => {
    const mockArticle = {
      url: 'https://example.com/article',
      source: 'web',
      title: 'Test Article'
    };

    const response = await apiService.captureContent(mockArticle);

    expect(response.status).toBe('processing');
    expect(response.id).toBeDefined();
    expect(response.estimatedProcessingTime).toBeGreaterThan(0);
  });

  test('should handle content extraction failure gracefully', async () => {
    const invalidUrl = {
      url: 'https://invalid-domain-that-does-not-exist.com',
      source: 'web'
    };

    await expect(apiService.captureContent(invalidUrl))
      .rejects.toThrow('CONTENT_EXTRACTION_FAILED');
  });
});
```

#### Context Detection Testing
```typescript
describe('Context Detection', () => {
  test('should detect commute context correctly', async () => {
    const contextSignals = {
      location: { latitude: 37.7749, longitude: -122.4194 },
      calendar: [{ title: 'Daily Commute', start: '2024-01-01T08:00:00Z' }],
      deviceContext: { type: 'mobile', timeAvailable: 45 }
    };

    const context = await contextService.detectContext('user-id', contextSignals);

    expect(context.type).toBe('commute');
    expect(context.suggestedContentTypes).toContain('audio');
    expect(context.confidenceScore).toBeGreaterThan(0.7);
  });
});
```

### Data Validation Requirements and Edge Cases

#### Input Validation Test Cases
```typescript
// Content capture validation
const invalidCaptureRequests = [
  { url: 'not-a-url', source: 'web' }, // Invalid URL format
  { text: 'a'.repeat(100001), source: 'manual' }, // Text too long
  { source: 'invalid-source' }, // Invalid source type
  { url: '', source: 'web' }, // Empty required field
];

// User preference validation
const invalidPreferences = [
  { timezone: 'Invalid/Timezone' }, // Invalid timezone
  { readingSpeed: -1 }, // Negative reading speed
  { notificationSettings: { frequency: 'invalid' } }, // Invalid enum value
];
```

#### Performance Test Scenarios
```typescript
describe('Performance Requirements', () => {
  test('should load inbox within 2 seconds', async () => {
    const startTime = Date.now();
    await apiService.getInboxContent();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('should process content capture within 5 seconds', async () => {
    const captureRequest = { url: 'https://example.com', source: 'web' };
    const startTime = Date.now();

    const result = await apiService.captureContent(captureRequest);
    const processTime = Date.now() - startTime;

    expect(processTime).toBeLessThan(5000);
    expect(result.status).toBe('processing');
  });
});
```

### Integration Points Requiring Testing

#### External Service Integration Tests
```typescript
// AI service integration
describe('AI Service Integration', () => {
  test('should handle AI service timeout gracefully', async () => {
    // Mock slow AI response
    jest.setTimeout(35000);

    const longContent = 'Very long article content...';
    const result = await aiService.summarizeContent(longContent);

    expect(result).toBeDefined();
    expect(result.processingTime).toBeLessThan(30000);
  });

  test('should fallback to secondary AI provider', async () => {
    // Mock primary AI service failure
    mockPrimaryAI.mockRejectedValue(new Error('Service unavailable'));

    const content = 'Article content to summarize';
    const summary = await aiService.summarizeContent(content);

    expect(summary.provider).toBe('fallback');
    expect(summary.text).toBeDefined();
  });
});
```

#### Calendar Integration Testing
```typescript
describe('Calendar Integration', () => {
  test('should sync with Google Calendar successfully', async () => {
    const calendarEvents = await calendarService.getUpcomingEvents('user-id');

    expect(calendarEvents).toBeInstanceOf(Array);
    expect(calendarEvents.length).toBeGreaterThanOrEqual(0);

    if (calendarEvents.length > 0) {
      expect(calendarEvents[0]).toHaveProperty('title');
      expect(calendarEvents[0]).toHaveProperty('start');
      expect(calendarEvents[0]).toHaveProperty('end');
    }
  });
});
```

### Performance Benchmarks and Quality Metrics

#### Core Performance Metrics
```typescript
const performanceThresholds = {
  pageLoad: 2000, // milliseconds
  contentCapture: 5000, // milliseconds
  aiProcessing: 30000, // milliseconds
  searchResponse: 1000, // milliseconds

  // Scalability targets
  concurrentUsers: 10000,
  responseUnder200ms: 0.95, // 95% of requests
  responseUnder500ms: 0.99, // 99% of requests

  // Calm technology metrics
  maxNotificationsPerDay: 3,
  minTimeBetweenNotifications: 3600000, // 1 hour in milliseconds
  maxPollingFrequency: 30000, // 30 seconds
};
```

#### User Experience Quality Tests
```typescript
describe('Calm Technology Compliance', () => {
  test('should not send notifications more than 3 times per day', async () => {
    const userId = 'test-user';
    const today = new Date().toISOString().split('T')[0];

    const notificationCount = await notificationService.getDailyNotificationCount(userId, today);

    expect(notificationCount).toBeLessThanOrEqual(3);
  });

  test('should respect Do Not Disturb hours', async () => {
    const dndHours = { start: 22, end: 7 }; // 10 PM to 7 AM
    const currentHour = new Date().getHours();

    if (currentHour >= dndHours.start || currentHour < dndHours.end) {
      const shouldSendNotification = await notificationService.shouldSendNotification('user-id');
      expect(shouldSendNotification).toBe(false);
    }
  });
});
```

### Security Testing Considerations

#### Authentication and Authorization Tests
```typescript
describe('Security Controls', () => {
  test('should reject requests without valid JWT token', async () => {
    const response = await fetch('/api/content/inbox', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    expect(response.status).toBe(403);
  });

  test('should enforce rate limiting', async () => {
    const requests = Array(101).fill(null).map(() =>
      apiService.captureContent({ url: 'https://example.com', source: 'web' })
    );

    await expect(Promise.all(requests)).rejects.toThrow('RATE_LIMIT_EXCEEDED');
  });

  test('should sanitize user input', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const content = await apiService.captureContent({
      text: maliciousInput,
      source: 'manual'
    });

    expect(content.content_text).not.toContain('<script>');
  });
});
```

---

## For Security Analysts

### Authentication Flow and Security Model

#### OAuth 2.0 Implementation
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant OAuth Provider

    User->>Frontend: Click "Sign in with Google"
    Frontend->>OAuth Provider: Redirect with client_id, scope
    User->>OAuth Provider: Authenticate and authorize
    OAuth Provider->>Frontend: Redirect with authorization code
    Frontend->>Backend: Send authorization code
    Backend->>OAuth Provider: Exchange code for access token
    OAuth Provider->>Backend: Return access token and user info
    Backend->>Backend: Create/update user record
    Backend->>Frontend: Return JWT access token
    Frontend->>Frontend: Store token securely
```

#### JWT Token Security
```typescript
interface JWTSecurity {
  algorithm: 'RS256'; // Asymmetric signing
  issuer: 'later-app.com';
  audience: 'later-app-users';
  expiresIn: '15m'; // Short-lived access tokens
  refreshTokenExpiresIn: '7d'; // Longer-lived refresh tokens

  // Token rotation strategy
  rotateRefreshTokens: true;
  revokeTokensOnLogout: true;
  blacklistCompromisedTokens: true;
}

// Secure token storage (frontend)
const tokenStorage = {
  store: (token: string) => {
    // Use httpOnly cookies for refresh tokens
    // Use memory/sessionStorage for access tokens
    sessionStorage.setItem('accessToken', token);
  },

  retrieve: () => {
    return sessionStorage.getItem('accessToken');
  },

  clear: () => {
    sessionStorage.removeItem('accessToken');
    // Clear httpOnly refresh token via API call
  }
};
```

#### Multi-Factor Authentication (MFA) Support
```typescript
interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  backupCodes: {
    count: 10;
    used: boolean[];
    generatedAt: Date;
  };

  // Risk-based MFA triggering
  triggers: {
    newDevice: boolean;
    newLocation: boolean;
    suspiciousActivity: boolean;
    highValueActions: boolean;
  };
}
```

### Data Encryption and Privacy with Supabase

#### Supabase Built-in Encryption
```typescript
// Supabase encryption configuration (automatic)
const supabaseEncryption = {
  // Database encryption at rest (automatic)
  databaseEncryption: {
    provider: 'AWS', // Supabase runs on AWS
    algorithm: 'AES-256',
    keyManagement: 'AWS KMS',
    automaticKeyRotation: true,
  },

  // Connection encryption (automatic)
  connectionEncryption: {
    protocol: 'TLS 1.3',
    certificateValidation: true,
    enforceSSL: true,
  },

  // Storage encryption (Supabase Storage)
  storageEncryption: {
    serverSideEncryption: 'AES-256',
    inTransitEncryption: 'TLS 1.3',
    cdnEncryption: true,
  },

  // JWT encryption
  jwtSecurity: {
    algorithm: 'HS256',
    secretRotation: 'manual', // via Supabase dashboard
    tokenExpiry: '1h',
    refreshTokenExpiry: '30d',
  }
};

// Mobile-specific encryption for offline data
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

class MobileEncryptionService {
  // Encrypt sensitive data before storing in SecureStore
  async encryptOfflineData(data: any, userId: string): Promise<string> {
    const userKey = await this.getUserEncryptionKey(userId)
    const plaintext = JSON.stringify(data)

    // Use device hardware encryption when available
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      plaintext + userKey
    )

    return encrypted
  }

  // Generate or retrieve user-specific encryption key
  private async getUserEncryptionKey(userId: string): Promise<string> {
    const keyName = `encryption_key_${userId}`

    let key = await SecureStore.getItemAsync(keyName)
    if (!key) {
      // Generate new key using device entropy
      key = await Crypto.getRandomBytesAsync(32).then(
        bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
      )

      await SecureStore.setItemAsync(keyName, key, {
        requireAuthentication: true, // Require biometric/passcode to access
        authenticationPrompt: 'Authenticate to access your encryption key'
      })
    }

    return key
  }

  // Secure deletion of sensitive data
  async secureDelete(keyName: string): Promise<void> {
    await SecureStore.deleteItemAsync(keyName)
  }
};

// Privacy controls and data minimization
class PrivacyService {
  // Implement data retention policies
  async enforceDataRetention(userId: string): Promise<void> {
    const retentionPeriod = 365 * 24 * 60 * 60 * 1000 // 1 year
    const cutoffDate = new Date(Date.now() - retentionPeriod)

    // Auto-delete old content based on user preferences
    await supabase
      .from('content_items')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())
      .eq('auto_delete', true)
  }

  // GDPR/CCPA compliance - complete data export
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [profile, content, tags, sessions, contexts] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('content_items').select('*').eq('user_id', userId),
      supabase.from('tags').select('*').eq('user_id', userId),
      supabase.from('reading_sessions').select('*').eq('user_id', userId),
      supabase.from('user_contexts').select('*').eq('user_id', userId)
    ])

    return {
      profile: profile.data,
      content: content.data,
      tags: tags.data,
      readingSessions: sessions.data,
      contexts: contexts.data,
      exportedAt: new Date().toISOString()
    }
  }

  // Complete data deletion (right to be forgotten)
  async deleteAllUserData(userId: string): Promise<void> {
    // RLS policies will ensure only user's own data is deleted
    await Promise.all([
      supabase.from('reading_sessions').delete().eq('user_id', userId),
      supabase.from('user_contexts').delete().eq('user_id', userId),
      supabase.from('content_tags').delete().using('content_items').eq('content_items.user_id', userId),
      supabase.from('tags').delete().eq('user_id', userId),
      supabase.from('content_items').delete().eq('user_id', userId),
      supabase.from('sync_operations').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('id', userId)
    ])

    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(userId)
  }
}
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  private async deriveUserKey(userId: string): Promise<Buffer> {
    return crypto.pbkdf2Sync(this.masterKey, userId, 100000, 32, 'sha256');
  }
}
```

#### Encryption in Transit
```typescript
// TLS Configuration
const tlsConfig = {
  minVersion: 'TLSv1.3',
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ],

  // HSTS configuration
  hsts: {
    maxAge: '31536000', // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Certificate pinning for mobile apps
  certificatePinning: {
    enabled: true,
    pinSet: ['primary-cert-hash', 'backup-cert-hash'],
    reportUri: '/api/security/cert-pin-report'
  }
};
```

### Input Validation and Sanitization

#### Content Sanitization Pipeline
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

class ContentSanitizer {
  private window = new JSDOM('').window;
  private purify = DOMPurify(this.window);

  sanitizeHTML(content: string): string {
    return this.purify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOWED_URI_REGEXP: /^https?:\/\//,
      KEEP_CONTENT: true
    });
  }

  sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim()
      .substring(0, 100000); // Limit length
  }

  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}
```

#### Request Validation Middleware
```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Security middleware stack
export const securityMiddleware = [
  // Basic security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "api.later-app.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting with user-specific limits
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Higher limits for premium users
      return req.user?.tier === 'premium' ? 200 : 100;
    },
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    }
  }),

  // Request size limits
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' })
];
```

### Security Headers and CORS Policies

#### CORS Configuration
```typescript
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://later-app.com',
      'https://app.later-app.com',
      'https://staging.later-app.com',
      // Chrome extension
      /^chrome-extension:\/\//,
      // Mobile app development
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
    ].filter(Boolean);

    if (!origin || allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  credentials: true,
  optionsSuccessStatus: 200,

  // Preflight cache
  maxAge: 86400 // 24 hours
};
```

### Vulnerability Prevention Measures

#### SQL Injection Prevention
```typescript
// Use parameterized queries exclusively
class SecureUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, created_at
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async searchContent(userId: string, searchTerm: string): Promise<ContentItem[]> {
    // Use full-text search with parameterized queries
    const query = `
      SELECT * FROM content_items
      WHERE user_id = $1
        AND search_vector @@ plainto_tsquery('english', $2)
        AND archived_at IS NULL
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC
      LIMIT 50
    `;

    const result = await this.db.query(query, [userId, searchTerm]);
    return result.rows;
  }
}
```

#### XSS Prevention Strategy
```typescript
// Content Security Policy (CSP) implementation
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Only for inline scripts we control
    "https://apis.google.com" // For OAuth
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // For dynamic theming
    "https://fonts.googleapis.com"
  ],
  imgSrc: [
    "'self'",
    "data:",
    "https:", // For user-generated content images
    "blob:" // For captured screenshots
  ],
  connectSrc: [
    "'self'",
    "https://api.later-app.com",
    "https://*.googleapis.com"
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com"
  ],

  // Prevent embedding in frames
  frameAncestors: ["'none'"],

  // Block mixed content
  upgradeInsecureRequests: [],

  // Enable violation reporting
  reportUri: ["/api/security/csp-report"]
};
```

#### API Security Controls
```typescript
// API security middleware
class APISecurityService {
  // Request signature verification for webhooks
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Audit logging for sensitive operations
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: event.success,
      errorCode: event.errorCode,
      riskScore: this.calculateRiskScore(event)
    };

    // Store in secure audit database
    await this.auditRepository.create(auditLog);

    // Alert on high-risk events
    if (auditLog.riskScore > 0.8) {
      await this.alertService.sendSecurityAlert(auditLog);
    }
  }

  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // New device/location
    if (event.isNewDevice) score += 0.3;
    if (event.isNewLocation) score += 0.3;

    // Failed authentication attempts
    if (event.action === 'login' && !event.success) score += 0.4;

    // Sensitive data access
    if (event.resource === 'user_content' && event.action === 'export') score += 0.5;

    return Math.min(score, 1.0);
  }
}
```

---

## Service Architecture & Component Design

### Microservices Breakdown

#### Core Service Boundaries
```typescript
// Service definitions with clear responsibilities
interface ServiceArchitecture {
  userService: {
    responsibilities: [
      'User authentication and authorization',
      'User preferences and settings',
      'Account management and billing'
    ];
    dependencies: ['database', 'email-service', 'payment-service'];
    endpoints: ['/auth/*', '/users/*', '/preferences/*'];
  };

  contentService: {
    responsibilities: [
      'Content capture and ingestion',
      'Content storage and retrieval',
      'Content search and filtering'
    ];
    dependencies: ['database', 'storage-service', 'search-service'];
    endpoints: ['/content/*', '/library/*', '/search/*'];
  };

  aiService: {
    responsibilities: [
      'Content summarization',
      'Content classification and tagging',
      'Content quality analysis'
    ];
    dependencies: ['ai-providers', 'queue-service'];
    endpoints: ['/ai/*'];
  };

  contextService: {
    responsibilities: [
      'Context detection and analysis',
      'Content recommendation engine',
      'Usage pattern analysis'
    ];
    dependencies: ['calendar-apis', 'location-service', 'database'];
    endpoints: ['/context/*', '/recommendations/*'];
  };

  notificationService: {
    responsibilities: [
      'Notification scheduling and delivery',
      'Do-not-disturb management',
      'Gentle reminder system'
    ];
    dependencies: ['push-service', 'email-service', 'sms-service'];
    endpoints: ['/notifications/*'];
  };
}
```

#### Inter-Service Communication
```typescript
// Event-driven architecture for loose coupling
interface ServiceEvents {
  'user.created': {
    userId: string;
    email: string;
    preferences: UserPreferences;
  };

  'content.captured': {
    contentId: string;
    userId: string;
    source: string;
    contentType: string;
  };

  'content.processed': {
    contentId: string;
    summary: string;
    tags: string[];
    processingTime: number;
  };

  'context.detected': {
    userId: string;
    contextType: string;
    confidence: number;
    timestamp: Date;
  };

  'recommendation.generated': {
    userId: string;
    recommendations: ContentRecommendation[];
    context: DetectedContext;
  };
}

// Event bus implementation using Redis Streams
class EventBus {
  private redis: Redis;

  async publish<T extends keyof ServiceEvents>(
    event: T,
    data: ServiceEvents[T]
  ): Promise<void> {
    await this.redis.xadd(
      `events:${event}`,
      '*',
      'data', JSON.stringify(data),
      'timestamp', Date.now()
    );
  }

  async subscribe<T extends keyof ServiceEvents>(
    event: T,
    handler: (data: ServiceEvents[T]) => Promise<void>
  ): Promise<void> {
    const stream = `events:${event}`;

    while (true) {
      const messages = await this.redis.xread('BLOCK', 1000, 'STREAMS', stream, '$');

      for (const [, eventMessages] of messages) {
        for (const [, fields] of eventMessages) {
          const data = JSON.parse(fields[1]);
          await handler(data);
        }
      }
    }
  }
}
```

### Data Flow Architecture

#### Content Processing Pipeline
```mermaid
graph TD
    A[Content Capture] --> B[Validation & Sanitization]
    B --> C[Content Extraction]
    C --> D[Queue for AI Processing]
    D --> E[AI Summarization]
    E --> F[Content Classification]
    F --> G[Tag Generation]
    G --> H[Store in Database]
    H --> I[Index for Search]
    I --> J[Notify User]

    D --> K[Immediate Storage]
    K --> L[Show in Inbox]

    E --> M[Check Processing Time]
    M --> N{> 30 seconds?}
    N -->|Yes| O[Fallback Summary]
    N -->|No| F
```

#### Context-Aware Recommendation Flow
```mermaid
graph TD
    A[User Activity Signal] --> B[Context Detection]
    B --> C[Pattern Analysis]
    C --> D[Content Matching]
    D --> E[Recommendation Scoring]
    E --> F[Gentle Notification Check]
    F --> G{Should Notify?}
    G -->|Yes| H[Send Recommendation]
    G -->|No| I[Queue for Later]

    J[Calendar Integration] --> B
    K[Location Service] --> B
    L[Device Context] --> B

    H --> M[Track Engagement]
    I --> M
    M --> N[Learn User Preferences]
```

### Shared Libraries and Utilities

#### Common Types and Interfaces
```typescript
// Shared type definitions across services
export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  subscriptionTier: 'free' | 'premium';
  createdAt: Date;
  lastActiveAt: Date;
}

export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  url?: string;
  contentText: string;
  contentHtml?: string;
  summary?: string;
  contentType: 'article' | 'video' | 'podcast' | 'document';
  source: 'web' | 'email' | 'voice' | 'screenshot' | 'manual';
  wordCount: number;
  estimatedReadTime: number;
  tags: string[];
  status: 'processing' | 'ready' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

export interface DetectedContext {
  type: 'commute' | 'break' | 'focus_time' | 'evening' | 'weekend';
  confidence: number;
  factors: {
    location?: LocationContext;
    calendar?: CalendarContext;
    timePattern?: TimePatternContext;
    device?: DeviceContext;
  };
  suggestedContentTypes: string[];
  estimatedTimeAvailable: number; // minutes
}

export interface ContentRecommendation {
  contentId: string;
  relevanceScore: number;
  contextMatch: number;
  reasoning: string[];
  estimatedEngagementTime: number;
}
```

#### Utility Services
```typescript
// Logger service with structured logging
export class LoggerService {
  private logger: winston.Logger;

  constructor(serviceName: string) {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: serviceName },
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' })
      ]
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.stack, ...meta });
  }

  // Security-specific logging
  security(event: string, userId?: string, meta?: any) {
    this.logger.warn(`SECURITY: ${event}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
}

// Configuration management
export class ConfigService {
  private config: Map<string, any> = new Map();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Load from environment variables with validation
    this.config.set('database', {
      url: this.required('DATABASE_URL'),
      maxConnections: this.optional('DATABASE_MAX_CONNECTIONS', 20),
      sslMode: this.optional('DATABASE_SSL_MODE', 'require')
    });

    this.config.set('ai', {
      openaiApiKey: this.required('OPENAI_API_KEY'),
      anthropicApiKey: this.required('ANTHROPIC_API_KEY'),
      maxTokens: this.optional('AI_MAX_TOKENS', 4000),
      timeoutMs: this.optional('AI_TIMEOUT_MS', 30000)
    });

    this.config.set('features', {
      enableContextDetection: this.optional('ENABLE_CONTEXT_DETECTION', true),
      enableNotifications: this.optional('ENABLE_NOTIFICATIONS', true),
      maxContentPerUser: this.optional('MAX_CONTENT_PER_USER', 10000)
    });
  }

  get<T>(key: string): T {
    return this.config.get(key);
  }

  private required(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private optional<T>(key: string, defaultValue: T): T {
    const value = process.env[key];
    if (!value) return defaultValue;

    // Type coercion based on default value type
    if (typeof defaultValue === 'boolean') {
      return (value.toLowerCase() === 'true') as unknown as T;
    }
    if (typeof defaultValue === 'number') {
      return parseInt(value, 10) as unknown as T;
    }
    return value as unknown as T;
  }
}
```

---

## Integration Architecture

### AI Service Abstraction Layer

#### Multi-Provider AI Strategy
```typescript
// Abstract AI provider interface
interface AIProvider {
  name: string;
  summarize(content: string, options?: SummarizationOptions): Promise<Summary>;
  classify(content: string): Promise<Classification>;
  generateTags(content: string): Promise<string[]>;
  checkAvailability(): Promise<boolean>;
}

// OpenAI implementation
class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarize(content: string, options?: SummarizationOptions): Promise<Summary> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize the following content in 2-3 sentences, focusing on key insights and actionable information.'
        },
        {
          role: 'user',
          content: content.substring(0, 8000) // Limit input length
        }
      ],
      max_tokens: options?.maxLength || 150,
      temperature: 0.3
    });

    return {
      text: response.choices[0].message.content,
      provider: this.name,
      confidence: 0.85, // OpenAI generally reliable
      processingTime: Date.now() - startTime
    };
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

// Anthropic implementation
class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;

  async summarize(content: string, options?: SummarizationOptions): Promise<Summary> {
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options?.maxLength || 150,
      messages: [
        {
          role: 'user',
          content: `Summarize this content in 2-3 sentences: ${content.substring(0, 8000)}`
        }
      ]
    });

    return {
      text: response.content[0].text,
      provider: this.name,
      confidence: 0.88,
      processingTime: Date.now() - startTime
    };
  }
}

// AI service orchestrator with fallback logic
class AIService {
  private providers: AIProvider[] = [];
  private primaryProvider: AIProvider;
  private fallbackProvider: AIProvider;

  constructor() {
    this.providers = [
      new OpenAIProvider(process.env.OPENAI_API_KEY!),
      new AnthropicProvider(process.env.ANTHROPIC_API_KEY!)
    ];

    this.primaryProvider = this.providers[0];
    this.fallbackProvider = this.providers[1];
  }

  async summarizeContent(content: string): Promise<Summary> {
    try {
      // Try primary provider first
      return await this.primaryProvider.summarize(content);
    } catch (error) {
      console.warn(`Primary AI provider failed: ${error.message}`);

      try {
        // Fallback to secondary provider
        return await this.fallbackProvider.summarize(content);
      } catch (fallbackError) {
        console.error(`All AI providers failed: ${fallbackError.message}`);

        // Return basic extractive summary as last resort
        return this.generateExtractiveSummary(content);
      }
    }
  }

  private generateExtractiveSummary(content: string): Summary {
    // Simple extractive summarization as fallback
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 3).join('. ') + '.';

    return {
      text: summary,
      provider: 'extractive-fallback',
      confidence: 0.4,
      processingTime: 100
    };
  }
}
```

### Calendar Integration Strategy

#### Multi-Provider Calendar Support
```typescript
// Abstract calendar provider
interface CalendarProvider {
  name: string;
  getUpcomingEvents(userId: string, timeRange: TimeRange): Promise<CalendarEvent[]>;
  detectFreeTime(userId: string, timeRange: TimeRange): Promise<TimeSlot[]>;
  refreshToken(userId: string): Promise<void>;
}

// Google Calendar implementation
class GoogleCalendarProvider implements CalendarProvider {
  name = 'google';
  private oauth2Client: OAuth2Client;

  async getUpcomingEvents(userId: string, timeRange: TimeRange): Promise<CalendarEvent[]> {
    const userTokens = await this.getUserTokens(userId);
    this.oauth2Client.setCredentials(userTokens);

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeRange.start.toISOString(),
      timeMax: timeRange.end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items?.map(event => ({
      id: event.id!,
      title: event.summary || 'Untitled Event',
      start: new Date(event.start?.dateTime || event.start?.date!),
      end: new Date(event.end?.dateTime || event.end?.date!),
      isAllDay: !!event.start?.date,
      location: event.location,
      description: event.description,
      attendees: event.attendees?.length || 0
    })) || [];
  }

  async detectFreeTime(userId: string, timeRange: TimeRange): Promise<TimeSlot[]> {
    const events = await this.getUpcomingEvents(userId, timeRange);
    const freeSlots: TimeSlot[] = [];

    let currentTime = timeRange.start;

    for (const event of events) {
      if (currentTime < event.start) {
        const duration = event.start.getTime() - currentTime.getTime();
        if (duration >= 15 * 60 * 1000) { // Minimum 15 minutes
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(event.start),
            duration: duration / (60 * 1000) // minutes
          });
        }
      }
      currentTime = event.end > currentTime ? event.end : currentTime;
    }

    return freeSlots;
  }
}

// Calendar service orchestrator
class CalendarService {
  private providers = new Map<string, CalendarProvider>();

  constructor() {
    this.providers.set('google', new GoogleCalendarProvider());
    this.providers.set('outlook', new OutlookCalendarProvider());
    this.providers.set('apple', new AppleCalendarProvider());
  }

  async getUserCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    const userConnections = await this.getUserCalendarConnections(userId);
    const allEvents: CalendarEvent[] = [];

    for (const connection of userConnections) {
      const provider = this.providers.get(connection.provider);
      if (provider) {
        try {
          const events = await provider.getUpcomingEvents(userId, {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          });
          allEvents.push(...events);
        } catch (error) {
          console.warn(`Failed to fetch from ${connection.provider}: ${error.message}`);
        }
      }
    }

    // Sort by start time and remove duplicates
    return allEvents
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .filter((event, index, arr) =>
        index === 0 ||
        event.title !== arr[index - 1].title ||
        event.start.getTime() !== arr[index - 1].start.getTime()
      );
  }
}
```

### Email Processing Pipeline

#### Email-to-Content Extraction
```typescript
// Email processing service
class EmailProcessingService {
  private emailParser: MailParser;
  private contentExtractor: ContentExtractor;

  async processIncomingEmail(emailData: Buffer): Promise<ContentItem[]> {
    const parsedEmail = await this.parseEmail(emailData);
    const extractedContent: ContentItem[] = [];

    // Extract content from email body
    if (parsedEmail.html || parsedEmail.text) {
      const emailContent = await this.extractEmailContent(parsedEmail);
      if (emailContent) {
        extractedContent.push(emailContent);
      }
    }

    // Extract content from links in email
    const links = this.extractLinks(parsedEmail.html || parsedEmail.text || '');
    for (const link of links) {
      try {
        const linkContent = await this.contentExtractor.extractFromURL(link);
        if (linkContent) {
          extractedContent.push(linkContent);
        }
      } catch (error) {
        console.warn(`Failed to extract content from ${link}: ${error.message}`);
      }
    }

    return extractedContent;
  }

  private async extractEmailContent(email: ParsedMail): Promise<ContentItem | null> {
    // Skip if email is too short or looks like notification
    const textContent = email.text || this.htmlToText(email.html);
    if (textContent.length < 100 || this.isNotificationEmail(email)) {
      return null;
    }

    return {
      id: generateUUID(),
      userId: this.extractUserIdFromEmail(email.to),
      title: email.subject || 'Email Content',
      contentText: textContent,
      contentHtml: email.html,
      contentType: 'article',
      source: 'email',
      wordCount: textContent.split(/\s+/).length,
      estimatedReadTime: Math.ceil(textContent.split(/\s+/).length / 200), // 200 WPM
      status: 'processing',
      createdAt: new Date()
    };
  }

  private isNotificationEmail(email: ParsedMail): boolean {
    const notificationKeywords = [
      'noreply', 'no-reply', 'notification', 'alert', 'reminder',
      'confirmation', 'receipt', 'invoice', 'password', 'verification'
    ];

    const fromAddress = email.from?.text?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';

    return notificationKeywords.some(keyword =>
      fromAddress.includes(keyword) || subject.includes(keyword)
    );
  }
}
```

### Browser Extension Integration

#### Cross-Browser Extension Architecture
```typescript
// Content script for web page content extraction
class ContentCapture {
  private apiClient: ExtensionAPIClient;

  constructor() {
    this.apiClient = new ExtensionAPIClient();
    this.initializeContentScript();
  }

  private initializeContentScript() {
    // Add Later capture button to page
    this.addCaptureButton();

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));

    // Auto-detect article content on page load
    if (this.isArticlePage()) {
      this.showQuickCaptureHint();
    }
  }

  private addCaptureButton() {
    const button = document.createElement('div');
    button.id = 'later-capture-button';
    button.innerHTML = `
      <div class="later-btn">
        <svg><!-- Later icon --></svg>
        Save to Later
      </div>
    `;
    button.addEventListener('click', this.captureCurrentPage.bind(this));

    // Position button based on page layout
    this.positionCaptureButton(button);
    document.body.appendChild(button);
  }

  private async captureCurrentPage() {
    const pageData = this.extractPageContent();

    try {
      await this.apiClient.captureContent({
        url: window.location.href,
        title: pageData.title,
        content: pageData.content,
        source: 'web',
        metadata: {
          captureMethod: 'browser-extension',
          userAgent: navigator.userAgent,
          capturedAt: new Date().toISOString()
        }
      });

      this.showSuccessNotification();
    } catch (error) {
      this.showErrorNotification(error.message);
    }
  }

  private extractPageContent(): PageContent {
    // Use multiple extraction strategies
    const extractors = [
      this.extractFromMercury.bind(this),
      this.extractFromReadability.bind(this),
      this.extractFromSchema.bind(this),
      this.extractBasicContent.bind(this)
    ];

    for (const extractor of extractors) {
      try {
        const content = extractor();
        if (content && content.text.length > 100) {
          return content;
        }
      } catch (error) {
        console.warn(`Extraction method failed: ${error.message}`);
      }
    }

    throw new Error('Could not extract content from page');
  }

  private isArticlePage(): boolean {
    // Check for article indicators
    const indicators = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-body',
      '.entry-content'
    ];

    return indicators.some(selector => document.querySelector(selector));
  }
}

// Background script for API communication
class ExtensionAPIClient {
  private baseURL = 'https://api.later-app.com';
  private authToken: string | null = null;

  async captureContent(data: CaptureRequest): Promise<ContentItem> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}/content/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Capture failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    // Get token from extension storage
    const result = await chrome.storage.sync.get(['authToken']);
    if (result.authToken) {
      this.authToken = result.authToken;
      return result.authToken;
    }

    throw new Error('User not authenticated');
  }
}
```

---

## Scalability and Performance Architecture

### Caching Strategy

#### Multi-Layer Caching Architecture
```typescript
// Cache abstraction layer
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

// Redis implementation
class RedisCache implements CacheProvider {
  private client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis(config);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(pattern = '*'): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

// Multi-tier caching service
class CachingService {
  private l1Cache = new Map<string, { value: any; expires: number }>(); // In-memory
  private l2Cache: RedisCache; // Redis
  private l3Cache: CloudFlareCDN; // CDN for static content

  constructor() {
    this.l2Cache = new RedisCache(config.redis);
    this.l3Cache = new CloudFlareCDN(config.cloudflare);
  }

  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first (in-memory)
    const l1Result = this.l1Cache.get(key);
    if (l1Result && l1Result.expires > Date.now()) {
      return l1Result.value;
    }

    // Try L2 cache (Redis)
    const l2Result = await this.l2Cache.get<T>(key);
    if (l2Result) {
      // Populate L1 cache
      this.l1Cache.set(key, {
        value: l2Result,
        expires: Date.now() + 60000 // 1 minute L1 TTL
      });
      return l2Result;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    // Set in all cache layers
    this.l1Cache.set(key, {
      value,
      expires: Date.now() + Math.min(ttl * 1000, 60000)
    });

    await this.l2Cache.set(key, value, ttl);
  }

  // Cache invalidation strategies
  async invalidateUserContent(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `content:*:user:${userId}`,
      `recommendations:${userId}:*`
    ];

    for (const pattern of patterns) {
      await this.l2Cache.clear(pattern);
    }

    // Clear related L1 cache entries
    for (const [key] of this.l1Cache) {
      if (patterns.some(pattern => key.includes(userId))) {
        this.l1Cache.delete(key);
      }
    }
  }
}
```

### Database Optimization

#### Query Optimization Strategy
```sql
-- Optimized indexes for common queries
CREATE INDEX CONCURRENTLY idx_content_items_user_status_created
  ON content_items (user_id, status, created_at DESC)
  WHERE status != 'deleted';

CREATE INDEX CONCURRENTLY idx_content_items_search_vector
  ON content_items USING GIN (search_vector)
  WHERE status = 'ready';

CREATE INDEX CONCURRENTLY idx_reading_sessions_user_recent
  ON reading_sessions (user_id, started_at DESC)
  WHERE ended_at IS NOT NULL;

-- Partial indexes for active users
CREATE INDEX CONCURRENTLY idx_users_active_recent
  ON users (last_active_at DESC)
  WHERE last_active_at > NOW() - INTERVAL '30 days';

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_content_recommendations
  ON content_items (user_id, content_type, estimated_read_time)
  WHERE status = 'ready' AND archived_at IS NULL;
```

#### Database Partitioning Strategy
```sql
-- Partition content_items by created_at for performance
CREATE TABLE content_items_y2024m01 PARTITION OF content_items
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE content_items_y2024m02 PARTITION OF content_items
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automated partition management
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  partition_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  end_date := start_date + interval '1 month';
  partition_name := 'content_items_y' || extract(year from start_date) ||
                   'm' || lpad(extract(month from start_date)::text, 2, '0');

  EXECUTE format('CREATE TABLE %I PARTITION OF content_items
                  FOR VALUES FROM (%L) TO (%L)',
                 partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Schedule partition creation
SELECT cron.schedule('create-partitions', '0 0 25 * *', 'SELECT create_monthly_partition();');
```

### Auto-Scaling Infrastructure

#### Container Orchestration
```yaml
# Kubernetes deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: later-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: later-api
  template:
    metadata:
      labels:
        app: later-api
    spec:
      containers:
      - name: api
        image: later/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: later-api-service
spec:
  selector:
    app: later-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: later-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: later-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

#### CDN and Edge Distribution
```typescript
// CloudFlare integration for global content delivery
class CDNService {
  private cloudflare: CloudflareAPI;

  constructor() {
    this.cloudflare = new CloudflareAPI({
      apiToken: process.env.CLOUDFLARE_API_TOKEN
    });
  }

  async cacheContent(contentId: string, content: string): Promise<string> {
    const key = `content/${contentId}`;
    const url = await this.uploadToR2(key, content);

    // Set cache headers for optimal performance
    await this.setCacheRules(url, {
      ttl: 86400, // 24 hours
      edgeCacheTtl: 7200, // 2 hours
      browserCacheTtl: 3600 // 1 hour
    });

    return url;
  }

  async purgeCache(patterns: string[]): Promise<void> {
    await this.cloudflare.cache.purge({
      files: patterns
    });
  }

  // Edge function for content preprocessing
  async deployEdgeFunction(code: string): Promise<void> {
    await this.cloudflare.workers.scripts.upload({
      name: 'content-processor',
      body: code,
      bindings: [
        {
          type: 'kv_namespace',
          name: 'CONTENT_CACHE',
          namespace_id: process.env.CLOUDFLARE_KV_NAMESPACE
        }
      ]
    });
  }
}
```

### Performance Monitoring

#### Application Performance Monitoring
```typescript
// Custom performance monitoring service
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();

  async trackApiCall(
    endpoint: string,
    duration: number,
    statusCode: number,
    userId?: string
  ): Promise<void> {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      endpoint,
      duration,
      statusCode,
      userId,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    // Store metric
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(metric);

    // Alert on performance degradation
    await this.checkPerformanceThresholds(endpoint, metric);

    // Emit metric to monitoring service
    await this.emitMetric(metric);
  }

  private async checkPerformanceThresholds(
    endpoint: string,
    metric: PerformanceMetric
  ): Promise<void> {
    const thresholds = {
      '/content/capture': 5000, // 5 seconds
      '/recommendations/now': 2000, // 2 seconds
      '/library/search': 1000, // 1 second
      '/content/read': 2000 // 2 seconds
    };

    const threshold = thresholds[endpoint];
    if (threshold && metric.duration > threshold) {
      await this.alertService.sendAlert({
        type: 'performance_degradation',
        endpoint,
        actualDuration: metric.duration,
        expectedDuration: threshold,
        userId: metric.userId
      });
    }
  }

  // Generate performance reports
  async generateDailyReport(): Promise<PerformanceReport> {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const report: PerformanceReport = {
      period: { start: dayAgo, end: now },
      endpoints: {}
    };

    for (const [endpoint, metrics] of this.metrics) {
      const recentMetrics = metrics.filter(m => m.timestamp > dayAgo);

      if (recentMetrics.length > 0) {
        const durations = recentMetrics.map(m => m.duration);

        report.endpoints[endpoint] = {
          requestCount: recentMetrics.length,
          averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          p95Duration: this.percentile(durations, 0.95),
          p99Duration: this.percentile(durations, 0.99),
          errorRate: recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length
        };
      }
    }

    return report;
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Real-time monitoring dashboard data
class MonitoringDashboard {
  async getRealtimeMetrics(): Promise<DashboardData> {
    return {
      systemHealth: {
        apiResponseTime: await this.getAverageResponseTime(),
        databaseConnections: await this.getDatabaseConnectionCount(),
        queueDepth: await this.getQueueDepth(),
        cacheHitRate: await this.getCacheHitRate(),
        errorRate: await this.getErrorRate()
      },

      userMetrics: {
        activeUsers: await this.getActiveUserCount(),
        contentCaptureRate: await this.getContentCaptureRate(),
        recommendationClickRate: await this.getRecommendationClickRate(),
        avgSessionDuration: await this.getAverageSessionDuration()
      },

      businessMetrics: {
        dailySignups: await this.getDailySignups(),
        conversionRate: await this.getConversionRate(),
        churnRate: await this.getChurnRate(),
        revenue: await this.getDailyRevenue()
      }
    };
  }
}
```

---

## Development and Deployment Strategy

### Expo EAS and Vercel CI/CD Pipeline

#### Mobile App Deployment with EAS
```yaml
# .github/workflows/mobile-deployment.yml
name: Later Mobile App CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: later_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd frontend && npm ci

    - name: Run linting
      run: |
        npm run lint
        cd frontend && npm run lint

    - name: Run type checking
      run: |
        npm run type-check
        cd frontend && npm run type-check

    - name: Run backend tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/later_test
        REDIS_URL: redis://localhost:6379
        NODE_ENV: test

    - name: Run frontend tests
      run: cd frontend && npm test -- --coverage

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/later_test

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Run npm audit
      run: |
        npm audit --audit-level=high
        cd frontend && npm audit --audit-level=high

  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.DOCKER_REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile
        push: true
        tags: |
          ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/backend:latest
          ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build frontend
      run: |
        cd frontend
        npm ci
        npm run build

    - name: Deploy to CloudFlare Pages
      uses: cloudflare/pages-action@v1
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        projectName: later-app
        directory: frontend/dist
        gitHubToken: ${{ secrets.GITHUB_TOKEN }}

    - name: Deploy to Kubernetes
      run: |
        echo "${{ secrets.KUBE_CONFIG_DATA }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

        # Update image in deployment
        kubectl set image deployment/later-api \
          api=${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/backend:${{ github.sha }}

        # Wait for rollout
        kubectl rollout status deployment/later-api --timeout=300s

    - name: Run smoke tests
      run: |
        sleep 30 # Wait for deployment to be ready
        npm run test:smoke
      env:
        API_URL: https://api.later-app.com

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

#### EAS Build Configuration
```json
// eas.json - Expo Application Services configuration
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-dev-supabase-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-dev-anon-key"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-staging-supabase-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-staging-anon-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-prod-supabase-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-prod-anon-key"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "path/to/service-account.json",
        "track": "production"
      }
    }
  },
  "update": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

#### Vercel Deployment Configuration
```json
// vercel.json - For web app and API endpoints
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    },
    {
      "src": "web/**/*",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/web/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "OPENAI_API_KEY": "@openai-api-key"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Environment Management

#### Multi-Environment Configuration
```typescript
// Environment-specific configurations
interface EnvironmentConfig {
  development: {
    database: {
      url: string;
      logging: boolean;
      synchronize: boolean;
    };
    redis: {
      url: string;
      keyPrefix: string;
    };
    ai: {
      openaiApiKey: string;
      anthropicApiKey: string;
      timeout: number;
    };
    features: {
      enableContextDetection: boolean;
      enableNotifications: boolean;
      debugMode: boolean;
    };
  };

  staging: {
    // Similar structure with staging-specific values
    database: {
      url: string;
      ssl: true;
      logging: false;
    };
    // ... other staging configs
  };

  production: {
    // Production-specific configuration
    database: {
      url: string;
      ssl: true;
      logging: false;
      connectionLimit: 20;
    };
    // ... other production configs
  };
}

// Configuration loader with validation
class ConfigLoader {
  private config: any;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration() {
    const configFile = path.join(__dirname, `../config/${this.environment}.json`);

    if (fs.existsSync(configFile)) {
      this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } else {
      this.config = this.getDefaultConfig();
    }

    // Override with environment variables
    this.applyEnvironmentOverrides();
  }

  private validateConfiguration() {
    const required = [
      'DATABASE_URL',
      'REDIS_URL',
      'OPENAI_API_KEY',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key] && !this.config[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  get<T>(path: string): T {
    return this.getNestedValue(this.config, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

### Database Migration Strategy

#### Automated Migration System
```typescript
// Database migration framework
abstract class Migration {
  abstract up(): Promise<void>;
  abstract down(): Promise<void>;
  abstract version: string;
  abstract description: string;
}

// Example migration
class AddContentSearchIndex extends Migration {
  version = '2024010101';
  description = 'Add full-text search index to content_items';

  async up(): Promise<void> {
    await this.db.query(`
      ALTER TABLE content_items
      ADD COLUMN search_vector tsvector;
    `);

    await this.db.query(`
      UPDATE content_items
      SET search_vector = to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(content_text, ''));
    `);

    await this.db.query(`
      CREATE INDEX idx_content_search
      ON content_items USING GIN(search_vector);
    `);

    await this.db.query(`
      CREATE OR REPLACE FUNCTION update_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english',
          coalesce(NEW.title, '') || ' ' || coalesce(NEW.content_text, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await this.db.query(`
      CREATE TRIGGER content_search_vector_update
      BEFORE INSERT OR UPDATE ON content_items
      FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    `);
  }

  async down(): Promise<void> {
    await this.db.query('DROP TRIGGER IF EXISTS content_search_vector_update ON content_items;');
    await this.db.query('DROP FUNCTION IF EXISTS update_search_vector();');
    await this.db.query('DROP INDEX IF EXISTS idx_content_search;');
    await this.db.query('ALTER TABLE content_items DROP COLUMN IF EXISTS search_vector;');
  }
}

// Migration runner
class MigrationRunner {
  private migrations: Migration[] = [];

  constructor(private db: Database) {
    this.loadMigrations();
  }

  async runMigrations(): Promise<void> {
    await this.ensureMigrationTable();

    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = this.migrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    );

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      console.log(`Applying migration ${migration.version}: ${migration.description}`);

      await this.db.transaction(async (trx) => {
        await migration.up();
        await trx.query(
          'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
          [migration.version]
        );
      });

      console.log(`Migration ${migration.version} applied successfully`);
    }
  }

  async rollbackMigration(version: string): Promise<void> {
    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    console.log(`Rolling back migration ${version}: ${migration.description}`);

    await this.db.transaction(async (trx) => {
      await migration.down();
      await trx.query('DELETE FROM schema_migrations WHERE version = $1', [version]);
    });

    console.log(`Migration ${version} rolled back successfully`);
  }
}
```

### Monitoring and Alerting

#### Comprehensive Monitoring Stack
```typescript
// Monitoring service integration
class MonitoringService {
  private prometheus: PrometheusRegistry;
  private alertManager: AlertManager;

  constructor() {
    this.prometheus = new PrometheusRegistry();
    this.alertManager = new AlertManager(config.alerting);
    this.setupMetrics();
  }

  private setupMetrics() {
    // HTTP request metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    // Database query metrics
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
    });

    // AI processing metrics
    this.aiProcessingDuration = new Histogram({
      name: 'ai_processing_duration_seconds',
      help: 'Duration of AI processing operations',
      labelNames: ['provider', 'operation'],
      buckets: [1, 5, 10, 20, 30, 60]
    });

    // Business metrics
    this.contentCaptureRate = new Counter({
      name: 'content_captures_total',
      help: 'Total number of content captures',
      labelNames: ['source', 'user_tier']
    });

    this.userSessionDuration = new Histogram({
      name: 'user_session_duration_seconds',
      help: 'Duration of user sessions',
      labelNames: ['user_tier'],
      buckets: [60, 300, 900, 1800, 3600, 7200] // 1m to 2h
    });
  }

  // Health check endpoints
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAIServices(),
      this.checkExternalAPIs()
    ]);

    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckResult(checks[0]),
        redis: this.getCheckResult(checks[1]),
        aiServices: this.getCheckResult(checks[2]),
        externalAPIs: this.getCheckResult(checks[3])
      }
    };

    // Overall status is unhealthy if any critical service is down
    const criticalServices = ['database', 'redis'];
    const hasUnhealthyCritical = criticalServices.some(
      service => status.checks[service].status === 'unhealthy'
    );

    if (hasUnhealthyCritical) {
      status.status = 'unhealthy';
    } else if (Object.values(status.checks).some(check => check.status === 'degraded')) {
      status.status = 'degraded';
    }

    return status;
  }

  // Alert configuration
  private setupAlerts() {
    const alerts = [
      {
        name: 'HighErrorRate',
        condition: 'rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05',
        description: 'HTTP error rate is above 5%',
        severity: 'critical',
        for: '2m'
      },
      {
        name: 'HighResponseTime',
        condition: 'histogram_quantile(0.95, http_request_duration_seconds) > 5',
        description: '95th percentile response time is above 5 seconds',
        severity: 'warning',
        for: '5m'
      },
      {
        name: 'AIProcessingTimeout',
        condition: 'ai_processing_duration_seconds > 30',
        description: 'AI processing is taking longer than 30 seconds',
        severity: 'warning',
        for: '1m'
      },
      {
        name: 'DatabaseConnections',
        condition: 'db_connections_active / db_connections_max > 0.8',
        description: 'Database connection usage is above 80%',
        severity: 'warning',
        for: '2m'
      },
      {
        name: 'LowContentCaptureRate',
        condition: 'rate(content_captures_total[1h]) < 10',
        description: 'Content capture rate is unusually low',
        severity: 'info',
        for: '30m'
      }
    ];

    return alerts;
  }
}

// Centralized logging configuration
class LoggingService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: 'later-api',
            environment: process.env.NODE_ENV,
            ...meta
          });
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 50000000, // 50MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 50000000,
          maxFiles: 10
        })
      ]
    });

    // Add remote logging in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.Http({
        host: 'logs.later-app.com',
        port: 443,
        path: '/log',
        ssl: true
      }));
    }
  }

  // Structured logging methods
  userAction(userId: string, action: string, metadata?: any) {
    this.logger.info('User action', {
      userId,
      action,
      category: 'user_behavior',
      ...metadata
    });
  }

  apiRequest(req: Request, res: Response, duration: number) {
    this.logger.info('API request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      category: 'api_request'
    });
  }

  aiProcessing(operation: string, provider: string, duration: number, success: boolean) {
    this.logger.info('AI processing', {
      operation,
      provider,
      duration,
      success,
      category: 'ai_processing'
    });
  }

  securityEvent(event: string, userId?: string, metadata?: any) {
    this.logger.warn('Security event', {
      event,
      userId,
      category: 'security',
      severity: 'medium',
      ...metadata
    });
  }
}
```

### Simplified Service Architecture with Supabase Integration

#### Integrated Services Overview
```typescript
// Simplified architecture leveraging Supabase's integrated platform
interface SupabaseServiceArchitecture {
  // Supabase handles most infrastructure concerns
  supabaseServices: {
    database: 'Postgres with RLS'; // Replaces separate database service
    auth: 'Built-in authentication'; // Replaces auth microservice
    storage: 'File and media storage'; // Replaces storage microservice
    realtime: 'WebSocket subscriptions'; // Replaces message queue
    edgeFunctions: 'Serverless compute'; // Replaces multiple microservices
  };

  // Simplified application services
  applicationServices: {
    mobileApp: {
      framework: 'Expo/React Native';
      responsibilities: [
        'User interface and experience',
        'Offline-first data management',
        'Device sensor integration',
        'Camera and sharing capabilities'
      ];
    };

    edgeFunctions: {
      contentProcessor: 'AI content analysis and summarization';
      recommendationEngine: 'Context-aware content suggestions';
      backgroundTasks: 'Scheduled jobs and data processing';
    };

    vercelAPI: {
      webApp: 'Optional web companion interface';
      apiEndpoints: 'Additional serverless functions';
      staticSites: 'Marketing and documentation';
    };
  };

  // External integrations (simplified)
  externalServices: {
    openAI: 'AI processing and content analysis';
    deviceSensors: 'Location, calendar, camera via Expo';
    appStores: 'Distribution via EAS Build';
    monitoring: 'Sentry for error tracking';
  };
}
```

#### Benefits of Simplified Architecture
```typescript
// Advantages of the Supabase-based approach
const architectureBenefits = {
  // Reduced complexity
  infrastructure: {
    beforeSupabase: 'Multiple microservices, databases, message queues',
    afterSupabase: 'Single Supabase project with integrated services',
    reduction: '80% fewer infrastructure components'
  },

  // Faster development
  development: {
    authentication: 'Built-in with multiple providers',
    database: 'Automatic API generation with type safety',
    realtime: 'WebSocket subscriptions out of the box',
    security: 'Row Level Security built into the database'
  },

  // Lower operational overhead
  operations: {
    scaling: 'Automatic scaling handled by Supabase',
    backups: 'Automatic database backups',
    monitoring: 'Built-in observability dashboard',
    updates: 'Managed infrastructure updates'
  },

  // Cost efficiency
  economics: {
    infrastructure: 'Pay-as-you-scale pricing model',
    maintenance: 'Reduced DevOps and maintenance costs',
    timeToMarket: 'Faster MVP development and iteration'
  }
};
```

---

This comprehensive technical architecture blueprint provides implementation-ready specifications for the "Later" app development team. The updated architecture emphasizes:

1. **Mobile-first approach** with Expo/React Native for cross-platform development
2. **Integrated backend services** using Supabase's unified platform
3. **Simplified deployment** through EAS Build and Vercel
4. **Privacy-first design** with Supabase RLS and device-level encryption
5. **Offline-first capabilities** with background sync and local storage
6. **Robust security** with comprehensive authentication, authorization, and input validation
7. **Monitoring and observability** for proactive issue detection and resolution

The engineering team can use this blueprint to begin immediate development of the MVP features while ensuring the foundation supports the product's long-term vision and scalability requirements.