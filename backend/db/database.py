import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "db", "k_heroes.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
DB_VOLUME_MOUNT_PATH = os.environ.get("DB_VOLUME_MOUNT_PATH", "/data")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _uses_volume_backed_sqlite() -> bool:
    if not DATABASE_URL.startswith("sqlite"):
        return False
    db_path = DATABASE_URL.removeprefix("sqlite:///")
    mount_path = DB_VOLUME_MOUNT_PATH.rstrip("/")
    return db_path == mount_path or db_path.startswith(f"{mount_path}/")


def configure_sqlite_for_volume() -> None:
    """GCS FUSE 등 네트워크 볼륨 위 SQLite 안정성을 위한 PRAGMA."""
    if not _uses_volume_backed_sqlite():
        return

    with engine.begin() as conn:
        conn.execute(text("PRAGMA journal_mode=DELETE"))
        conn.execute(text("PRAGMA synchronous=NORMAL"))


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
