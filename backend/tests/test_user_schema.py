from sqlalchemy import inspect

from db.models import AuthProvider, User, UserGrade


def test_users_table_has_login_id_name_and_grade_columns(test_engine):
    inspector = inspect(test_engine)
    columns = {column["name"] for column in inspector.get_columns("users")}

    assert "auth_provider" in columns
    assert "provider_user_id" in columns
    assert "login_id" in columns
    assert "name" in columns
    assert "grade" in columns

    column_map = {column["name"]: column for column in inspector.get_columns("users")}
    assert column_map["auth_provider"]["nullable"] is False
    assert column_map["provider_user_id"]["nullable"] is True
    assert column_map["login_id"]["nullable"] is True
    assert column_map["name"]["nullable"] is True
    assert column_map["email"]["nullable"] is True
    assert column_map["password_hash"]["nullable"] is True
    assert column_map["nickname"]["nullable"] is True


def test_user_grade_defaults_to_student(db_session):
    user = User(
        auth_provider=AuthProvider.LOCAL,
        login_id="test_user",
        name="테스트유저",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.grade == UserGrade.STUDENT
