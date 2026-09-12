import json
import os
from datetime import datetime, timezone
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row


DATABASE_URL = os.getenv("DATABASE_URL")


class DuplicateComplaintError(Exception):
    def __init__(self, duplicate_of: str):
        self.duplicate_of = duplicate_of
        super().__init__(f"Complaint already exists as {duplicate_of}")


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
                duplicate_of TEXT REFERENCES complaints(complaint_id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        connection.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS analysis JSONB")
        connection.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_of TEXT REFERENCES complaints(complaint_id)")


def create_complaint(fields: dict) -> dict:
    complaint_id = f"CMP-{datetime.now(timezone.utc):%y%m%d-%H%M%S}-{uuid4().hex[:6].upper()}"
    with get_connection() as connection:
        duplicate = connection.execute(
            """
            SELECT complaint_id FROM complaints
            WHERE LOWER(COALESCE(fields->>'customerName', '')) = LOWER(COALESCE(%s, ''))
              AND LOWER(COALESCE(fields->>'productName', '')) = LOWER(COALESCE(%s, ''))
              AND LOWER(COALESCE(fields->>'batchNumber', '')) = LOWER(COALESCE(%s, ''))
              AND LOWER(COALESCE(fields->>'complaintType', '')) = LOWER(COALESCE(%s, ''))
              AND COALESCE(fields->>'customerName', '') <> ''
              AND COALESCE(fields->>'productName', '') <> ''
              AND COALESCE(fields->>'batchNumber', '') <> ''
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (fields.get("customerName"), fields.get("productName"), fields.get("batchNumber"), fields.get("complaintType")),
        ).fetchone()
        if duplicate:
            raise DuplicateComplaintError(duplicate["complaint_id"])
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
            "SELECT complaint_id, fields, analysis, duplicate_of, created_at FROM complaints ORDER BY created_at DESC"
        ).fetchall()


def get_complaint(complaint_id: str) -> dict | None:
    with get_connection() as connection:
        return connection.execute(
            "SELECT complaint_id, fields, analysis, duplicate_of, created_at FROM complaints WHERE complaint_id = %s",
            (complaint_id,),
        ).fetchone()


def update_analysis(complaint_id: str, analysis: dict) -> dict | None:
    with get_connection() as connection:
        return connection.execute(
            """
            UPDATE complaints SET analysis = %s::jsonb
            WHERE complaint_id = %s
            RETURNING complaint_id, fields, analysis, created_at
            """,
            (json.dumps(analysis), complaint_id),
        ).fetchone()
