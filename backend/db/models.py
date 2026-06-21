from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from db.database import Base


class ManagedContentMixin:
    """인물·시나리오: 사용함/사용안함 + 소프트 삭제 (둘 다 별도)."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class SoftDeleteMixin:
    """하위 콘텐츠(턴/선택지/엔딩): 소프트 삭제만."""

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class CharacterCategory(ManagedContentMixin, Base):
    __tablename__ = "character_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    characters: Mapped[list["Character"]] = relationship(back_populates="character_category")


class Character(ManagedContentMixin, Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("character_categories.id", ondelete="RESTRICT"), nullable=False
    )
    era: Mapped[str] = mapped_column(String(100), nullable=False)
    era_tag: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    years: Mapped[str] = mapped_column(String(50), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    situation: Mapped[str] = mapped_column(Text, nullable=False)
    one_line_summary: Mapped[str] = mapped_column(Text, nullable=False)
    mbti: Mapped[str] = mapped_column(String(10), nullable=False)
    mbti_nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    mbti_e_i: Mapped[str] = mapped_column(Text, default="")
    mbti_s_n: Mapped[str] = mapped_column(Text, default="")
    mbti_t_f: Mapped[str] = mapped_column(Text, default="")
    mbti_j_p: Mapped[str] = mapped_column(Text, default="")
    intro_quote: Mapped[str] = mapped_column(Text, nullable=False)
    intro_desc: Mapped[str] = mapped_column(Text, nullable=False)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    associated_stories: Mapped[dict] = mapped_column(JSON, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    character_category: Mapped["CharacterCategory"] = relationship(back_populates="characters")
    stats: Mapped[list["CharacterStat"]] = relationship(
        back_populates="character", cascade="all, delete-orphan", order_by="CharacterStat.sort_order"
    )
    scenarios: Mapped[list["Scenario"]] = relationship(
        back_populates="character",
        cascade="all, delete-orphan",
        order_by="Scenario.sort_order",
    )

    @property
    def category(self) -> str:
        return self.character_category.label if self.character_category else ""


class CharacterStat(ManagedContentMixin, Base):
    __tablename__ = "character_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    character: Mapped["Character"] = relationship(back_populates="stats")


class Scenario(ManagedContentMixin, Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    historical_facts: Mapped[str] = mapped_column(Text, nullable=False)
    source_story_ids: Mapped[list] = mapped_column(JSON, default=list)

    character: Mapped["Character"] = relationship(back_populates="scenarios")
    turns: Mapped[list["Turn"]] = relationship(
        back_populates="scenario", cascade="all, delete-orphan", order_by="Turn.sort_order"
    )
    endings: Mapped[list["Ending"]] = relationship(
        back_populates="scenario", cascade="all, delete-orphan"
    )


class Turn(SoftDeleteMixin, Base):
    __tablename__ = "turns"
    __table_args__ = (UniqueConstraint("scenario_id", "sort_order", name="uq_scenario_turn"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    situation: Mapped[str] = mapped_column(Text, nullable=False)
    turn_image: Mapped[str] = mapped_column(String(500), default="")
    tip_title: Mapped[str] = mapped_column(Text, nullable=False)
    tip_desc: Mapped[str] = mapped_column(Text, nullable=False)

    scenario: Mapped["Scenario"] = relationship(back_populates="turns")
    choices: Mapped[list["Choice"]] = relationship(
        back_populates="turn", cascade="all, delete-orphan", order_by="Choice.choice_key"
    )


class Choice(SoftDeleteMixin, Base):
    __tablename__ = "choices"
    __table_args__ = (UniqueConstraint("turn_id", "choice_key", name="uq_turn_choice"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    turn_id: Mapped[int] = mapped_column(ForeignKey("turns.id", ondelete="CASCADE"), nullable=False)
    choice_key: Mapped[str] = mapped_column(String(1), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    choice_image: Mapped[str] = mapped_column(String(500), default="")
    result_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_historical: Mapped[bool] = mapped_column(Boolean, default=False)
    turn_stats: Mapped[list] = mapped_column(JSON, default=list)

    turn: Mapped["Turn"] = relationship(back_populates="choices")


class Ending(SoftDeleteMixin, Base):
    __tablename__ = "endings"
    __table_args__ = (UniqueConstraint("scenario_id", "path_key", name="uq_scenario_path"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False)
    path_key: Mapped[str] = mapped_column(String(50), nullable=False)
    ending_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    history_fact: Mapped[str] = mapped_column(Text, nullable=False)
    story_headline: Mapped[str] = mapped_column(Text, nullable=False)
    story_contents: Mapped[str] = mapped_column(Text, nullable=False)
    factual_contents: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    summary_items: Mapped[list] = mapped_column(JSON, default=list)
    recommended_places: Mapped[list] = mapped_column(JSON, default=list)

    scenario: Mapped["Scenario"] = relationship(back_populates="endings")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    play_sessions: Mapped[list["PlaySession"]] = relationship(back_populates="user")
    scenario_progress: Mapped[list["UserScenarioProgress"]] = relationship(back_populates="user")


class PlaySession(Base):
    """유저 플레이 기록. 엔딩 본문은 endings 테이블 조인, 당시 제목은 스냅샷으로 보존."""

    __tablename__ = "play_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scenario_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True
    )
    ending_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("endings.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="completed")
    choices_path: Mapped[list] = mapped_column(JSON, default=list)
    history_score: Mapped[int] = mapped_column(Integer, default=0)
    final_stats: Mapped[dict] = mapped_column(JSON, default=dict)
    character_name: Mapped[str] = mapped_column(String(100), default="")
    scenario_title: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped[Optional["User"]] = relationship(back_populates="play_sessions")
    scenario: Mapped[Optional["Scenario"]] = relationship()
    ending: Mapped[Optional["Ending"]] = relationship()


class UserScenarioProgress(Base):
    __tablename__ = "user_scenario_progress"
    __table_args__ = (UniqueConstraint("user_id", "scenario_id", name="uq_user_scenario_progress"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scenario_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True
    )
    character_name: Mapped[str] = mapped_column(String(100), default="")
    scenario_title: Mapped[str] = mapped_column(String(200), default="")
    is_cleared: Mapped[bool] = mapped_column(Boolean, default=False)
    best_history_score: Mapped[int] = mapped_column(Integer, default=0)
    play_count: Mapped[int] = mapped_column(Integer, default=0)
    first_cleared_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_played_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="scenario_progress")
    scenario: Mapped[Optional["Scenario"]] = relationship()
