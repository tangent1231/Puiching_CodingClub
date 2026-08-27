"""Awards router: search awards and download certificates."""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.feishu import FeishuClient, FeishuRecord

router = APIRouter()


class AwardOut(BaseModel):
    record_id: str
    name: str
    class_name: str = Field(default="", alias="class")
    competition: str = ""
    award: str = ""
    date: str = ""
    has_certificate: bool = False

    class Config:
        populate_by_name = True


MOCK_AWARDS = [
    AwardOut(record_id="1", name="陳子軒", class_name="F5A", competition="澳門中學生程式設計競賽", award="金獎", date="2024-05-18", has_certificate=True),
    AwardOut(record_id="2", name="林嘉欣", class_name="F5B", competition="澳門中學生程式設計競賽", award="銀獎", date="2024-05-18", has_certificate=True),
    AwardOut(record_id="3", name="黃偉豪", class_name="F4C", competition="校際電腦奧林匹克", award="一等獎", date="2024-03-10", has_certificate=True),
    AwardOut(record_id="4", name="張曉雯", class_name="F6A", competition="粵港澳青少年創客大賽", award="二等獎", date="2024-07-22", has_certificate=True),
    AwardOut(record_id="5", name="李俊傑", class_name="F5A", competition="全澳資訊科技周編程比賽", award="優異獎", date="2023-11-05", has_certificate=True),
    AwardOut(record_id="6", name="王美琪", class_name="F4B", competition="校際電腦奧林匹克", award="二等獎", date="2023-03-12", has_certificate=True),
    AwardOut(record_id="7", name="劉柏宏", class_name="F6B", competition="澳門中學生程式設計競賽", award="銅獎", date="2023-05-20", has_certificate=True),
    AwardOut(record_id="8", name="周詩敏", class_name="F5C", competition="粵港澳青少年創客大賽", award="三等獎", date="2023-07-15", has_certificate=True),
]


def _parse_award(record: FeishuRecord) -> AwardOut:
    fields = record.fields
    attachment = FeishuClient().get_first_attachment(fields, "證書附件")
    return AwardOut(
        record_id=record.record_id,
        name=_first_text(fields.get("姓名")),
        class_name=_first_text(fields.get("班級")),
        competition=_first_text(fields.get("競賽名稱")),
        award=_first_text(fields.get("獎項")),
        date=_first_text(fields.get("日期")),
        has_certificate=bool(attachment),
    )


def _first_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return str(value[0]) if value else ""
    if isinstance(value, dict):
        return str(value.get("text", ""))
    return str(value)


@router.get("", response_model=list[AwardOut])
async def list_awards(name: str = Query(default="", description="學生姓名關鍵字")):
    settings = get_settings()
    if not settings.feishu_configured:
        q = name.strip().lower()
        return [a for a in MOCK_AWARDS if not q or q in a.name.lower()]

    client = FeishuClient(settings)
    try:
        if name.strip():
            filter_conditions = {
                "conjunction": "and",
                "conditions": [
                    {
                        "field_name": "姓名",
                        "operator": "contains",
                        "value": [name.strip()],
                    }
                ],
            }
        else:
            filter_conditions = None

        records = await client.search_records(
            settings.feishu_table_awards,
            filter_conditions=filter_conditions,
        )
        return [_parse_award(r) for r in records]
    finally:
        await client.close()


@router.get("/{record_id}/certificate")
async def download_certificate(record_id: str):
    settings = get_settings()
    if not settings.feishu_configured:
        raise HTTPException(status_code=404, detail="未找到證書附件")

    client = FeishuClient(settings)
    try:
        records = await client.search_records(
            settings.feishu_table_awards,
            filter_conditions={
                "conjunction": "and",
                "conditions": [
                    {
                        "field_name": "record_id",
                        "operator": "is",
                        "value": [record_id],
                    }
                ],
            },
        )
        if not records:
            raise HTTPException(status_code=404, detail="未找到該記錄")

        attachment = client.get_first_attachment(records[0].fields, "證書附件")
        if not attachment:
            raise HTTPException(status_code=404, detail="未找到證書附件")

        file_token = attachment["file_token"]
        file_name = attachment.get("name", "certificate")
        content, downloaded_name = await client.download_attachment(file_token)
        display_name = downloaded_name or file_name

        return StreamingResponse(
            iter([content]),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{display_name}"',
                "Content-Length": str(len(content)),
            },
        )
    finally:
        await client.close()
