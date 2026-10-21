import os

import psycopg
from dotenv import load_dotenv


load_dotenv(".env")

if not os.getenv("DB_NAME"):
    raise RuntimeError("DB_NAME is not set. Add it to your .env file.")


connection = psycopg.connect(
    dbname=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=os.environ["DB_PORT"],
)


def db_connection():
    return connection
