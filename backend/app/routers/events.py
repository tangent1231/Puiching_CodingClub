"""Events router: public event announcements."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings
from app.feishu import FeishuClient, FeishuRecord

router = APIRouter()


class EventOut(BaseModel):
    record_id: str
    title: str
    status: str
    date: str
    description: str = ""


MOCK_EVENTS = [
    EventOut(record_id="e1", title="2024 澳門中學生程式設計競賽", status="報名進行中", date="2024-09-15", description="報名截止：2024-09-15"),
    EventOut(record_id="e2", title="校際電腦奧林匹克初賽", status="即將舉行", date="2024-10-12", description="比賽日期：2024-10-12"),
]


def _parse_event(record: FeishuRecord) -> EventOut:
    fields = record.fields
    return EventOut(
        record_id=record.record_id,
        title=_first_text(fields.get("活動名稱")) or _first_text(fields.get("標題")),
        status=_first_text(fields.get("狀態")) or "即將舉行",
        date=_first_text(fields.get("日期")),
        description=_first_text(fields.get("描述")),
    )


def _first_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return str(value[0]) if value else ""
    if isinstance(value, dict):
        return str(value.get("text", ""))
    return str(value)


@router.get("", response_model=list[EventOut])
async def list_events():
    settings = get_settings()
    if not settings.feishu_configured:
        return MOCK_EVENTS

    client = FeishuClient(settings)
    try:
        records = await client.search_records(settings.feishu_table_events)
        return [_parse_event(r) for r in records]
    finally:
        await client.close()
