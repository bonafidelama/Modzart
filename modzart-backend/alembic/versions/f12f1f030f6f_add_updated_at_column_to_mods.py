"""add_updated_at_column_to_mods

Revision ID: f12f1f030f6f
Revises: 18bb53b87abd
Create Date: 2025-05-05 02:57:56.231760

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = 'f12f1f030f6f'
down_revision: Union[str, None] = '18bb53b87abd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('mods', sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
    # Update all existing rows to set updated_at equal to created_at
    op.execute("UPDATE mods SET updated_at = created_at")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('mods', 'updated_at')
