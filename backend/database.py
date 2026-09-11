import json
import os
from datetime import datetime, timezone
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row


DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS complaints (
                id BIGSERIAL PRIMARY KEY,
                complaint_id TEXT UNIQUE NOT NULL,
                fields JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )


def create_complaint(fields: dict) -> dict:
    complaint_id = f"CMP-{datetime.now(timezone.utc):%y%m%d-%H%M%S}-{uuid4().hex[:6].upper()}"
    with get_connection() as connection:
        row = connection.execute(
            """
            INSERT INTO complaints (complaint_id, fields)
            VALUES (%s, %s::jsonb)
            RETURNING complaint_id, fields, created_at
            """,
            (complaint_id, json.dumps(fields)),
        ).fetchone()
    return {"complaint_id": row["complaint_id"], "fields": row["fields"], "created_at": row["created_at"]}


def list_complaints() -> list[dict]:
    with get_connection() as connection:
        return connection.execute(
            "SELECT complaint_id, fields, created_at FROM complaints ORDER BY created_at DESC"
        ).fetchall()


def get_complaint(complaint_id: str) -> dict | None:
    with get_connection() as connection:
        return connection.execute(
            "SELECT complaint_id, fields, created_at FROM complaints WHERE complaint_id = %s",
            (complaint_id,),
        ).fetchone()
