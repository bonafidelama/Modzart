"""add_project_visibility_column_to_mods

Revision ID: 927a408dea02
Revises: f12f1f030f6f
Create Date: 2025-05-05 03:37:35.298780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '927a408dea02'
down_revision: Union[str, None] = 'f12f1f030f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('mods', sa.Column('project_visibility', sa.String(), nullable=True, server_default='public'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('mods', 'project_visibility')
