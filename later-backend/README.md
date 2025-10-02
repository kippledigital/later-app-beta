# Later App Backend

A comprehensive backend system for the Later app built with Supabase and Vercel, implementing content management, AI processing, and context-aware features.

## Architecture Overview

### Technology Stack
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **API Layer**: Vercel serverless functions (Node.js)
- **AI Integration**: OpenAI API for content processing
- **Storage**: Supabase Storage for file attachments

### Core Features
- Content capture from multiple sources (web, email, voice, screenshots)
- AI-powered summarization and categorization
- Context-aware content suggestions
- Full-text and semantic search
- Real-time data synchronization
- Privacy-first design with user data controls

## Project Structure

```
later-backend/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   ├── 20241001000001_initial_schema.sql
│   │   └── 20241001000002_row_level_security.sql
│   └── functions/               # Edge Functions
│       ├── _shared/             # Shared utilities
│       ├── extract-content/     # URL content extraction
│       ├── process-content-ai/  # AI processing
│       ├── capture-content/     # Content capture pipeline
│       ├── context-suggestions/ # Context-aware suggestions
│       └── health-check/        # System health monitoring
├── api/                         # Vercel API endpoints
│   ├── _lib/                    # Shared utilities
│   ├── content/                 # Content management
│   ├── search.ts               # Search functionality
│   └── admin/                   # Admin endpoints
├── package.json
├── vercel.json                 # Vercel configuration
└── README.md
```

## Database Schema

### Core Tables
- `profiles` - Extended user profiles with preferences
- `content_items` - Main content storage with search vectors
- `content_categories` - User-defined content categories
- `content_tags` - Flexible tagging system
- `context_patterns` - Learned patterns for suggestions
- `smart_reminders` - Context-aware reminders
- `ai_processing_jobs` - AI processing queue and results
- `usage_analytics` - Privacy-compliant analytics
- `user_sessions` - Secure session management
- `api_rate_limits` - Rate limiting and abuse prevention

### Security Features
- Row Level Security (RLS) on all tables
- User data isolation
- Automatic data cleanup based on retention policies
- Encrypted sensitive data storage

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- Vercel CLI (optional)
- OpenAI API key

### Local Development

1. **Clone and install dependencies**
   ```bash
   cd later-backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Supabase locally**
   ```bash
   npx supabase start
   ```

4. **Run database migrations**
   ```bash
   npx supabase db reset
   ```

5. **Deploy Edge Functions locally**
   ```bash
   npx supabase functions serve
   ```

### Production Deployment

1. **Create Supabase project**
   ```bash
   npx supabase projects create later-app
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Deploy database schema**
   ```bash
   npx supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy
   ```

4. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

### Environment Variables

#### Required Variables
```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
```

#### Optional Variables
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Content Processing
MAX_CONTENT_SIZE=10485760
CONTENT_EXTRACTION_TIMEOUT=30000

# Features
ENABLE_LOCATION_CONTEXT=true
ENABLE_CALENDAR_CONTEXT=true
```

## API Documentation

### Authentication
All API endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Edge Functions

#### Content Extraction
```
POST /functions/v1/extract-content
Content-Type: application/json

{
  "url": "https://example.com/article",
  "timeout": 30000
}
```

#### AI Processing
```
POST /functions/v1/process-content-ai
Content-Type: application/json

{
  "content_id": "uuid",
  "content": "Article content...",
  "processing_types": ["summarize", "categorize", "generate_tags"]
}
```

#### Content Capture
```
POST /functions/v1/capture-content
Content-Type: application/json

{
  "source": "web_url",
  "url": "https://example.com",
  "content": "Optional content",
  "auto_process": true
}
```

#### Context Suggestions
```
POST /functions/v1/context-suggestions
Content-Type: application/json

{
  "context_type": "location",
  "context_data": {
    "location": { "lat": 40.7128, "lng": -74.0060 }
  }
}
```

### REST API Endpoints

#### Content Management
```
GET /api/content?page=1&limit=20&search=query
POST /api/content
GET /api/content/{id}
PUT /api/content/{id}
DELETE /api/content/{id}
```

#### Search
```
POST /api/search
Content-Type: application/json

{
  "query": "search terms",
  "search_type": "hybrid",
  "filters": {
    "categories": ["work"],
    "date_from": "2024-01-01"
  }
}
```

## Security Features

### Data Protection
- Row Level Security (RLS) policies
- User data isolation
- Encrypted sensitive information
- GDPR/CCPA compliance features

### Rate Limiting
- Per-user rate limits by endpoint
- Abuse prevention mechanisms
- Automatic IP blocking for suspicious activity

### Privacy Controls
- User-controlled data retention
- Location data approximation options
- AI processing opt-out capabilities

## Monitoring and Observability

### Health Checks
```
GET /functions/v1/health-check
```

Returns system health status including:
- Database connectivity
- External service availability
- Performance metrics
- Error rates

### Analytics
Admin users can access system analytics:
```
POST /api/admin/analytics
```

### Logging
Structured logging with:
- Performance metrics
- Error tracking
- Security alerts
- User activity analytics

## Performance Considerations

### Scaling
- Edge Functions auto-scale with demand
- Database connection pooling
- Efficient query optimization with proper indexes
- Content caching strategies

### Limits
- **Free Tier**: 100 content items/month, 1GB storage
- **Premium**: 5,000 items/month, 10GB storage
- **Enterprise**: Unlimited items, 100GB storage

### Optimization
- Full-text search with GIN indexes
- Proper database constraints and foreign keys
- Background job processing for AI tasks
- Circuit breaker patterns for external services

## Development Guidelines

### Code Quality
- TypeScript for type safety
- Comprehensive error handling
- Input validation and sanitization
- Security-first development practices

### Testing
```bash
# Run Supabase tests
npx supabase test

# Run Edge Function tests locally
npx supabase functions serve --env-file .env.test
```

### Contributing
1. Follow the existing code structure
2. Add comprehensive error handling
3. Include proper logging and monitoring
4. Update documentation for new features
5. Test all security policies

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify Supabase credentials
- Check network connectivity
- Ensure RLS policies are correctly configured

**AI Processing Failures**
- Validate OpenAI API key
- Check content size limits
- Monitor rate limiting

**Edge Function Timeouts**
- Optimize function execution time
- Implement proper retry logic
- Use circuit breakers for external calls

### Support
- Check the Supabase dashboard for logs
- Monitor Edge Function execution times
- Review error analytics in the admin panel

## License

This project is licensed under the MIT License - see the LICENSE file for details.