"""Feishu (Lark) Base OpenAPI client with in-memory token caching."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, NotRequired, TypedDict

import httpx
from fastapi import HTTPException

from app.config import Settings, get_settings


class _TokenInfo(TypedDict):
    token: str
    expires_at: datetime


class AttachmentMeta(TypedDict):
    file_token: str
    name: str
    size: int
    type: str
    url: NotRequired[str]


@dataclass
class FeishuRecord:
    record_id: str
    fields: dict[str, Any]


class FeishuClient:
    """Async Feishu OpenAPI client."""

    BASE_URL = "https://open.feishu.cn"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client = httpx.AsyncClient(base_url=self.BASE_URL, timeout=30.0)
        self._token: _TokenInfo | None = None
        self._lock = asyncio.Lock()

    async def close(self) -> None:
        await self._client.aclose()

    async def _get_tenant_access_token(self) -> str:
        async with self._lock:
            if self._token and self._token["expires_at"] > datetime.now(timezone.utc):
                return self._token["token"]

            resp = await self._client.post(
                "/open-apis/auth/v3/tenant_access_token/internal",
                json={
                    "app_id": self.settings.feishu_app_id,
                    "app_secret": self.settings.feishu_app_secret,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("code") != 0:
                raise HTTPException(
                    status_code=502,
                    detail=f"Feishu token error: {data.get('msg')} (code {data.get('code')})",
                )

            token = data["tenant_access_token"]
            expire = int(data.get("expire", 7200))
            self._token = {
                "token": token,
                "expires_at": datetime.now(timezone.utc)
                + timedelta(seconds=max(expire - 120, 60)),
            }
            return token

    def _headers(self, token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        }

    async def search_records(
        self,
        table_id: str,
        filter_conditions: dict[str, Any] | None = None,
        page_size: int = 500,
    ) -> list[FeishuRecord]:
        """Search records in a Feishu Base table."""
        if not self.settings.feishu_configured:
            raise RuntimeError("Feishu credentials are not configured")

        token = await self._get_tenant_access_token()
        url = (
            f"/open-apis/bitable/v1/apps/{self.settings.feishu_base_token}"
            f"/tables/{table_id}/records/search"
        )

        payload: dict[str, Any] = {"page_size": min(page_size, 500)}
        if filter_conditions:
            payload["filter"] = filter_conditions

        results: list[FeishuRecord] = []
        page_token: str | None = None
        while True:
            if page_token:
                payload["page_token"] = page_token
            resp = await self._client.post(url, headers=self._headers(token), json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("code") != 0:
                raise HTTPException(
                    status_code=502,
                    detail=f"Feishu search error: {data.get('msg')} (code {data.get('code')})",
                )

            items = data.get("data", {}).get("items", [])
            for item in items:
                results.append(
                    FeishuRecord(
                        record_id=item["record_id"],
                        fields=item.get("fields", {}),
                    )
                )

            page_token = data.get("data", {}).get("page_token")
            if not page_token or not items:
                break

        return results

    async def download_attachment(self, file_token: str) -> tuple[bytes, str]:
        """Download a Drive attachment by file_token."""
        if not self.settings.feishu_configured:
            raise RuntimeError("Feishu credentials are not configured")

        token = await self._get_tenant_access_token()
        resp = await self._client.get(
            f"/open-apis/drive/v1/medias/{file_token}/download",
            headers={"Authorization": f"Bearer {token}"},
            follow_redirects=True,
        )
        resp.raise_for_status()

        content_disposition = resp.headers.get("content-disposition", "")
        filename = "certificate"
        if "filename=" in content_disposition:
            filename = content_disposition.split("filename=")[-1].strip('"')
        return resp.content, filename

    def get_first_attachment(self, fields: dict[str, Any], field_name: str) -> AttachmentMeta | None:
        value = fields.get(field_name)
        if not value:
            return None
        if isinstance(value, list) and value:
            return value[0]
        if isinstance(value, dict):
            return value
        return None


# Convenience module-level helpers
async def search_table_records(
    table_id: str,
    filter_conditions: dict[str, Any] | None = None,
    page_size: int = 500,
    settings: Settings | None = None,
) -> list[FeishuRecord]:
    client = FeishuClient(settings)
    try:
        return await client.search_records(table_id, filter_conditions, page_size)
    finally:
        await client.close()


async def download_file(file_token: str, settings: Settings | None = None) -> tuple[bytes, str]:
    client = FeishuClient(settings)
    try:
        return await client.download_attachment(file_token)
    finally:
        await client.close()
