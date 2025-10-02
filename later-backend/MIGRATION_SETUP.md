# Later App Database Migration Setup

This guide will help you set up the database for the Later app using Alembic migrations with Supabase.

## Prerequisites

1. **Python 3.9+** installed
2. **Supabase account** - Sign up at [supabase.com](https://supabase.com)
3. **Supabase project** created

## Step 1: Install Dependencies

```bash
cd later-backend
pip3 install -r requirements.txt
```

## Step 2: Set Up Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project (or select existing)
3. Wait for the project to finish setting up
4. Note down your project details

## Step 3: Get Supabase Credentials

### Database Connection URL
1. In your Supabase project, go to **Settings** > **Database**
2. Scroll down to "Connection string"
3. Copy the URI format: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with your database password

### API Credentials
1. Go to **Settings** > **API**
2. Copy:
   - Project URL (e.g., `https://your-project.supabase.co`)
   - `anon` `public` key
   - `service_role` `secret` key

## Step 4: Configure Environment Variables

1. Edit the `.env` file in the `later-backend` directory
2. Replace the template values with your actual Supabase credentials:

```env
# Database URL for Alembic migrations
DATABASE_URL=postgresql://postgres:your-actual-password@db.your-project-ref.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# OpenAI Configuration (optional for migration)
OPENAI_API_KEY=your-openai-api-key
```

## Step 5: Run the Migration

### Option A: Using the Migration Script (Recommended)
```bash
python3 migrate.py
```

This script will:
- Check if all dependencies are installed
- Verify environment variables are configured
- Run the Alembic migration
- Provide helpful feedback

### Option B: Using Alembic Directly
```bash
# Check migration status
/Users/20649638/Library/Python/3.9/bin/alembic current

# Run migration
/Users/20649638/Library/Python/3.9/bin/alembic upgrade head
```

## What Gets Created

The migration will create the following in your Supabase database:

### Tables
- `profiles` - User profiles linked to auth.users
- `content_items` - Main content storage
- `user_contexts` - User-defined contexts for suggestions
- `content_highlights` - User highlights and notes
- `collections` - User-created content collections
- `collection_items` - Items within collections
- `consumption_sessions` - Reading/listening session tracking
- `notifications` - User notifications
- `ai_processing_logs` - AI processing audit trail
- `analytics_events` - App usage analytics
- `offline_sync_queue` - Offline synchronization queue

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Policies** that ensure users can only access their own data
- **Proper foreign key constraints** and data integrity

### Extensions
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `pg_trgm` - Text search and similarity
- `fuzzystrmatch` - Fuzzy string matching

## Verification

After successful migration:

1. Check your Supabase dashboard
2. Go to **Table Editor**
3. You should see all the tables listed above
4. Go to **Authentication** > **Policies** to see RLS policies

## Troubleshooting

### Connection Issues
- Verify your database password is correct
- Check that your Supabase project is active
- Ensure your IP is allowed (Supabase allows all IPs by default)

### Permission Issues
- Make sure you're using the correct service role key
- Verify your Supabase project has been fully provisioned

### Migration Errors
- Check that the SQL files exist in `supabase/migrations/`
- Verify no manual changes were made to the database
- Try running `alembic downgrade base` and then `alembic upgrade head`

## Next Steps

After successful migration:

1. **Test the connection** by running a simple query in Supabase SQL Editor
2. **Set up authentication** in your frontend app
3. **Configure OpenAI API** for content processing
4. **Start developing** your Later app features

## Files Created

- `alembic/` - Alembic configuration and migrations
- `alembic.ini` - Alembic configuration file
- `migrate.py` - Migration helper script
- `.env` - Environment variables (contains secrets)
- `requirements.txt` - Python dependencies

## Important Notes

- **Never commit** `.env` file to version control
- **Keep** your Supabase credentials secure
- **RLS policies** ensure user data isolation
- **The migration is idempotent** - safe to run multiple times

Need help? Check the [Supabase documentation](https://supabase.com/docs) or [Alembic documentation](https://alembic.sqlalchemy.org/).