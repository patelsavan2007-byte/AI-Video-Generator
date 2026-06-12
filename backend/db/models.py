import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, Float, Integer, ForeignKey,
    Enum as SAEnum, DateTime
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    pass


class UserPlan(str, enum.Enum):
    free = "free"
    pro = "pro"


class JobStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    plan: Mapped[UserPlan] = mapped_column(
        SAEnum(UserPlan, name="userplan"), default=UserPlan.free
    )

    videos: Mapped[list["Video"]] = relationship(
        "Video", back_populates="user", cascade="all, delete-orphan"
    )


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="jobstatus"), default=JobStatus.queued, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="videos")
    job: Mapped["GenJob"] = relationship(
        "GenJob", back_populates="video", uselist=False, cascade="all, delete-orphan"
    )


class GenJob(Base):
    __tablename__ = "gen_jobs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )
    worker_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    gpu_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Generation parameters stored with the job
    duration: Mapped[float] = mapped_column(Float, default=4.0)
    fps: Mapped[int] = mapped_column(Integer, default=16)
    resolution: Mapped[str] = mapped_column(String(20), default="512x512")
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aspect_ratio: Mapped[str] = mapped_column(String(10), default="16:9")
    init_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    video: Mapped["Video"] = relationship("Video", back_populates="job")
