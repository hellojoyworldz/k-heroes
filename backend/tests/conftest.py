import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.database import Base, get_db
import db.models  # noqa: F401
from db.seed import seed_character_categories, seed_characters, seed_endings
from main import app

pytest_plugins = ["tests.admin_auth_helpers"]


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    session = sessionmaker(bind=engine)()
    try:
        category_lookup = seed_character_categories(session)
        scenario_lookup = seed_characters(session, category_lookup)
        seed_endings(session, scenario_lookup)
        session.commit()
    finally:
        session.close()

    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client, jwt_env, superadmin_user):
    return client
