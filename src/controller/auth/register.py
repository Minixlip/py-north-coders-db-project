from fastapi import HTTPException
from psycopg.rows import dict_row
from pwdlib import PasswordHash

from db.connection import db_connection
from src.types.auth.register import RegisterRequest


password_hash = PasswordHash.recommended()


def create_user(user: RegisterRequest):
    hashed_password = password_hash.hash(user.password.get_secret_value())
    conn = db_connection()
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, password)
                VALUES (%s, %s, %s)
                ON CONFLICT (email) DO NOTHING
                RETURNING id, name, email, created_at
                """,
                (user.name, user.email, hashed_password),
            )
            created_user = cursor.fetchone()

    if created_user is None:
        raise HTTPException(status_code=409, detail="Email already registered.")
    return created_user
