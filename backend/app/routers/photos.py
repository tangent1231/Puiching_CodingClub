"""Photos router: activity photos grouped by year."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.config import get_settings
from app.feishu import FeishuClient, FeishuRecord

router = APIRouter()


class PhotoOut(BaseModel):
    record_id: str
    year: int
    title: str
    image_url: str
    order: int = 0


MOCK_PHOTOS = [
    PhotoOut(record_id="p1", year=2024, title="編程工作坊 · 2024.03", image_url="/activity-1.jpg", order=1),
    PhotoOut(record_id="p2", year=2024, title="校際比賽 · 2024.05", image_url="/activity-2.jpg", order=2),
    PhotoOut(record_id="p3", year=2023, title="暑期集訓營 · 2023.08", image_url="/activity-3.jpg", order=1),
]


def _parse_photo(record: FeishuRecord, client: FeishuClient) -> PhotoOut:
    fields = record.fields
    year_raw = fields.get("年份", 2024)
    try:
        year = int(year_raw) if not isinstance(year_raw, list) else int(year_raw[0])
    except (ValueError, TypeError, IndexError):
        year = 2024

    order_raw = fields.get("顯示順序", 0)
    try:
        order = int(order_raw) if not isinstance(order_raw, list) else int(order_raw[0])
    except (ValueError, TypeError, IndexError):
        order = 0

    attachment = client.get_first_attachment(fields, "照片附件")
    image_url = ""
    if attachment:
        image_url = attachment.get("url", "")
        if not image_url:
            image_url = f"/api/photos/{record.record_id}/image"

    return PhotoOut(
        record_id=record.record_id,
        year=year,
        title=_first_text(fields.get("標題")),
        image_url=image_url,
        order=order,
    )


def _first_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return str(value[0]) if value else ""
    if isinstance(value, dict):
        return str(value.get("text", ""))
    return str(value)


@router.get("", response_model=list[PhotoOut])
async def list_photos(year: int | None = Query(default=None, description="篩選年份")):
    settings = get_settings()
    if not settings.feishu_configured:
        photos = MOCK_PHOTOS
        if year is not None:
            photos = [p for p in photos if p.year == year]
        return sorted(photos, key=lambda p: (p.year, p.order))

    client = FeishuClient(settings)
    try:
        if year is not None:
            filter_conditions = {
                "conjunction": "and",
                "conditions": [
                    {
                        "field_name": "年份",
                        "operator": "is",
                        "value": [str(year)],
                    }
                ],
            }
        else:
            filter_conditions = None

        records = await client.search_records(
            settings.feishu_table_photos,
            filter_conditions=filter_conditions,
        )
        photos = [_parse_photo(r, client) for r in records]
        return sorted(photos, key=lambda p: (p.year, p.order))
    finally:
        await client.close()


@router.get("/years", response_model=list[int])
async def list_years():
    settings = get_settings()
    if not settings.feishu_configured:
        return sorted({p.year for p in MOCK_PHOTOS}, reverse=True)

    client = FeishuClient(settings)
    try:
        records = await client.search_records(settings.feishu_table_photos)
        years: set[int] = set()
        for r in records:
            year_raw = r.fields.get("年份", 2024)
            try:
                year = int(year_raw) if not isinstance(year_raw, list) else int(year_raw[0])
                years.add(year)
            except (ValueError, TypeError, IndexError):
                continue
        return sorted(years, reverse=True)
    finally:
        await client.close()
