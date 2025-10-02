"""initial_schema_and_rls

Revision ID: e03a1e69d490
Revises: 
Create Date: 2025-10-02 10:25:22.391081

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e03a1e69d490'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Execute the fixed initial schema SQL file
    with open('supabase/migrations/20241001000001_initial_schema_fixed.sql', 'r') as f:
        initial_schema_sql = f.read()
        op.execute(initial_schema_sql)

    # Execute the fixed RLS policies SQL file
    with open('supabase/migrations/20241001000002_row_level_security_fixed.sql', 'r') as f:
        rls_sql = f.read()
        op.execute(rls_sql)


def downgrade() -> None:
    # Drop all RLS policies first
    tables = ['profiles', 'content_items', 'user_contexts', 'content_highlights',
              'collections', 'collection_items', 'consumption_sessions', 'notifications',
              'ai_processing_logs', 'analytics_events', 'offline_sync_queue']

    for table in tables:
        op.execute(f"DROP POLICY IF EXISTS \"Users can view own {table}\" ON {table}")
        op.execute(f"DROP POLICY IF EXISTS \"Users can manage own {table}\" ON {table}")

    # Drop specific policies
    op.execute("DROP POLICY IF EXISTS \"Users can view own profile\" ON profiles")
    op.execute("DROP POLICY IF EXISTS \"Users can update own profile\" ON profiles")
    op.execute("DROP POLICY IF EXISTS \"Users can view own content\" ON content_items")
    op.execute("DROP POLICY IF EXISTS \"Users can insert own content\" ON content_items")
    op.execute("DROP POLICY IF EXISTS \"Users can update own content\" ON content_items")
    op.execute("DROP POLICY IF EXISTS \"Users can delete own content\" ON content_items")
    op.execute("DROP POLICY IF EXISTS \"Anyone can insert analytics events\" ON analytics_events")

    # Drop all tables
    op.drop_table('offline_sync_queue')
    op.drop_table('analytics_events')
    op.drop_table('ai_processing_logs')
    op.drop_table('notifications')
    op.drop_table('consumption_sessions')
    op.drop_table('collection_items')
    op.drop_table('collections')
    op.drop_table('content_highlights')
    op.drop_table('user_contexts')
    op.drop_table('content_items')
    op.drop_table('profiles')

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS notification_type")
    op.execute("DROP TYPE IF EXISTS context_type")
    op.execute("DROP TYPE IF EXISTS content_priority")
    op.execute("DROP TYPE IF EXISTS content_status")
    op.execute("DROP TYPE IF EXISTS content_source")
