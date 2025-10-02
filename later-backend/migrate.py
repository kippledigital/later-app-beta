#!/usr/bin/env python3
"""
Migration runner for Later app database setup with Supabase

This script helps set up and run database migrations using Alembic.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import alembic
        import sqlalchemy
        import psycopg2
        from dotenv import load_dotenv
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Run: pip3 install -r requirements.txt")
        return False

def check_env_vars():
    """Check if required environment variables are set"""
    from dotenv import load_dotenv
    load_dotenv()

    required_vars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']
    missing_vars = []

    for var in required_vars:
        if not os.getenv(var) or 'your-' in os.getenv(var, ''):
            missing_vars.append(var)

    if missing_vars:
        print("❌ Missing or template environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease update your .env file with actual Supabase credentials")
        print("Get them from: https://app.supabase.com")
        return False

    print("✅ Environment variables are configured")
    return True

def run_migration():
    """Run the Alembic migration"""
    try:
        # Set the path for alembic command
        alembic_path = "/Users/20649638/Library/Python/3.9/bin/alembic"
        if not os.path.exists(alembic_path):
            alembic_path = "alembic"  # Try system path

        result = subprocess.run([alembic_path, "upgrade", "head"],
                              capture_output=True, text=True)

        if result.returncode == 0:
            print("✅ Database migration completed successfully!")
            print(result.stdout)
            return True
        else:
            print("❌ Migration failed:")
            print(result.stderr)
            return False

    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

def main():
    """Main migration setup function"""
    print("🚀 Later App Database Migration Setup")
    print("=====================================\n")

    # Check requirements
    if not check_requirements():
        sys.exit(1)

    # Check environment variables
    if not check_env_vars():
        print("\n📝 To set up your Supabase database:")
        print("1. Go to https://app.supabase.com")
        print("2. Create a new project or select existing")
        print("3. Go to Settings > Database")
        print("4. Copy the connection string and update DATABASE_URL in .env")
        print("5. Go to Settings > API")
        print("6. Copy the URL and anon key and update .env")
        print("7. Run this script again")
        sys.exit(1)

    # Run migration
    print("\n🔄 Running database migration...")
    if run_migration():
        print("\n🎉 Setup complete! Your Later app database is ready.")
        print("\nNext steps:")
        print("1. Start developing your app")
        print("2. The database schema includes all tables with Row Level Security")
        print("3. Check Supabase dashboard to verify tables were created")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()