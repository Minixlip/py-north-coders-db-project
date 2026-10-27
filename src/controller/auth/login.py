from secrets import token_urlsafe

from fastapi import HTTPException
from psycopg.rows import dict_row
from pwdlib import PasswordHash

from db.connection import db_connection
from src.types.auth.login import LoginRequest


password_hash = PasswordHash.recommended()
dummy_hash = password_hash.hash(token_urlsafe(32))


def check_login(user: LoginRequest) -> int:
    conn = db_connection()
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT id, password FROM users WHERE email = %s",
                (user.email,),
            )
            found_user = cursor.fetchone()


    stored_hash = found_user["password"] if found_user else dummy_hash
    valid_password = password_hash.verify(
        user.password.get_secret_value(), stored_hash
    )
    if found_user is None or not valid_password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return found_user["id"]
