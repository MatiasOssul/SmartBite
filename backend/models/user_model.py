from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[str] = mapped_column(String, default="free", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    preferences: Mapped["PreferencesDB"] = relationship(
        "PreferencesDB", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    payment_methods: Mapped[list["PaymentMethodDB"]] = relationship(
        "PaymentMethodDB", back_populates="user", cascade="all, delete-orphan"
    )
    recipes: Mapped[list["RecipeDB"]] = relationship(  # type: ignore[name-defined]
        "RecipeDB", back_populates="user", cascade="all, delete-orphan"
    )


class PreferencesDB(Base):
    __tablename__ = "preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), unique=True, nullable=False
    )
    dietary_restrictions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    allergen_exclusions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    cooking_skill: Mapped[str] = mapped_column(String, default="intermediate", nullable=False)
    max_budget_clp: Mapped[int] = mapped_column(Integer, default=15000, nullable=False)

    user: Mapped["UserDB"] = relationship("UserDB", back_populates="preferences")


class PaymentMethodDB(Base):
    __tablename__ = "payment_methods"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    last_four: Mapped[str] = mapped_column(String, nullable=False)
    brand: Mapped[str] = mapped_column(String, nullable=False)
    exp_month: Mapped[int] = mapped_column(Integer, nullable=False)
    exp_year: Mapped[int] = mapped_column(Integer, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["UserDB"] = relationship("UserDB", back_populates="payment_methods")
