from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user", "admin"

    # Gamification stats
    xp = Column(Integer, default=0, nullable=False)
    coins = Column(Integer, default=100, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    lives = Column(Integer, default=5, nullable=False)
    last_life_refill = Column(DateTime, default=utcnow, nullable=False)
    streak = Column(Integer, default=0, nullable=False)
    last_active_date = Column(DateTime, default=utcnow, nullable=False)

    avatar = Column(String(50), default="cyber-snake", nullable=False)
    theme = Column(String(50), default="cyber-dark", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, index=True, nullable=False)
    chapter_title = Column(String(100), nullable=False)
    level_number = Column(Integer, unique=True, index=True, nullable=False)  # 1 to 50
    title = Column(String(120), nullable=False)
    story = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    hints_json = Column(Text, default="[]", nullable=False)
    test_cases_json = Column(Text, default="[]", nullable=False)
    explanation = Column(Text, nullable=False)
    xp_reward = Column(Integer, default=100, nullable=False)
    coin_reward = Column(Integer, default=25, nullable=False)
    is_boss = Column(Boolean, default=False, nullable=False)
    boss_name = Column(String(80), nullable=True)
    boss_hp = Column(Integer, nullable=True)
    difficulty = Column(String(20), default="Beginner", nullable=False)

    # Helper properties for JSON handling
    @property
    def hints(self):
        try:
            val = json.loads(self.hints_json or "[]")
            while isinstance(val, str):
                val = json.loads(val)
            return val if isinstance(val, list) else []
        except Exception:
            return []

    @hints.setter
    def hints(self, val):
        if isinstance(val, (list, dict)):
            self.hints_json = json.dumps(val)
        elif isinstance(val, str):
            self.hints_json = val

    @property
    def test_cases(self):
        try:
            val = json.loads(self.test_cases_json or "[]")
            while isinstance(val, str):
                val = json.loads(val)
            return val if isinstance(val, list) else []
        except Exception:
            return []

    @test_cases.setter
    def test_cases(self, val):
        if isinstance(val, (list, dict)):
            self.test_cases_json = json.dumps(val)
        elif isinstance(val, str):
            self.test_cases_json = val

    progress_entries = relationship("UserProgress", back_populates="challenge", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="challenge", cascade="all, delete-orphan")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    passed = Column(Boolean, default=False, nullable=False)
    stars = Column(Integer, default=0, nullable=False)  # 1 to 3
    attempts = Column(Integer, default=1, nullable=False)
    best_time_ms = Column(Float, default=0.0, nullable=False)
    code_submitted = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="progress")
    challenge = relationship("Challenge", back_populates="progress_entries")

    __table_args__ = (
        Index("idx_user_challenge", "user_id", "challenge_id", unique=True),
    )


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), nullable=False)
    category = Column(String(50), default="General", nullable=False)
    xp_bonus = Column(Integer, default=200, nullable=False)
    coin_bonus = Column(Integer, default=50, nullable=False)

    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True)
    unlocked_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")

    __table_args__ = (
        Index("idx_user_achievement", "user_id", "achievement_id", unique=True),
    )


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    status = Column(String(30), nullable=False)  # PASSED, FAILED, TIMEOUT, ERROR
    tests_passed = Column(Integer, default=0, nullable=False)
    total_tests = Column(Integer, default=0, nullable=False)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="submissions")
    challenge = relationship("Challenge", back_populates="submissions")


class MysteryBoxReward(Base):
    __tablename__ = "mystery_box_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    box_type = Column(String(30), nullable=False)
    reward_type = Column(String(30), nullable=False)  # COINS, XP, LIFE, THEME, BADGE
    reward_value = Column(String(100), nullable=False)
    opened_at = Column(DateTime, default=utcnow, nullable=False)
