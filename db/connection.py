import os

import psycopg
from dotenv import load_dotenv


load_dotenv(".env")

if not os.getenv("DB_NAME"):
    raise RuntimeError("DB_NAME is not set. Add it to your .env file.")


if not os.getenv("DB_USER"):
    raise RuntimeError("DB_USER is not set. Add it to your .env file.")

# Also would add DB_PASSWORD validation below

connection = psycopg.connect(
    autocommit=True,
    dbname=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=os.environ["DB_PORT"]
)


def db_connection():
    return connection
