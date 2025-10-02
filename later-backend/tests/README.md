# Backend Testing Framework

This directory contains comprehensive tests for the Later app backend services, including Supabase Edge Functions, database operations, and API integrations.

## Test Structure

```
tests/
├── README.md                    # This file
├── unit/                        # Unit tests for individual functions
│   ├── edge-functions/          # Edge Function unit tests
│   ├── database/                # Database operation tests
│   └── utils/                   # Utility function tests
├── integration/                 # Integration tests
│   ├── api/                     # API endpoint integration tests
│   ├── database/                # Database integration tests
│   └── external/                # External service integration tests
├── performance/                 # Performance and load tests
├── security/                    # Security and privacy tests
├── fixtures/                    # Test data and fixtures
├── helpers/                     # Test helper functions
├── mocks/                       # Mock implementations
└── config/                      # Test configuration
```

## Running Tests

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase stack
supabase start

# Install test dependencies
npm install
```

### Test Commands
```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Environment

### Local Testing
- Uses local Supabase stack with Docker
- Isolated test database with controlled data
- Mock external services (OpenAI, etc.)

### CI/CD Testing
- GitHub Actions with automated test execution
- Test results integration with PR status checks
- Performance regression detection

## Test Categories

### Unit Tests
- Edge Function business logic
- Database query functions
- Utility functions
- Data validation
- Error handling

### Integration Tests
- Complete API workflows
- Database operations with RLS
- External service integrations
- Authentication flows

### Performance Tests
- Load testing with multiple concurrent users
- Response time validation
- Memory usage monitoring
- Database query optimization

### Security Tests
- Authentication and authorization
- Input validation and sanitization
- Rate limiting effectiveness
- Data privacy compliance