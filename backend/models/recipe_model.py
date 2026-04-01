from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class RecipeDB(Base):
    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    cost_clp: Mapped[int] = mapped_column(Integer, nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    ingredients: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    instructions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    nutritional_info: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["UserDB"] = relationship(  # type: ignore[name-defined]
        "UserDB", back_populates="recipes"
    )
