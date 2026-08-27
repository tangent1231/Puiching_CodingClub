/**
 * Feishu (Lark) OpenAPI helpers for Supabase Edge Functions.
 */

export interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface AttachmentMeta {
  file_token: string;
  name: string;
  size?: number;
  type?: string;
  url?: string;
}

interface TokenInfo {
  token: string;
  expires_at: number;
}

const BASE_URL = "https://open.feishu.cn";
let cachedToken: TokenInfo | null = null;

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function isFeishuConfigured(): boolean {
  return Boolean(
    Deno.env.get("FEISHU_APP_ID") &&
      Deno.env.get("FEISHU_APP_SECRET") &&
      Deno.env.get("FEISHU_BASE_TOKEN"),
  );
}

async function fetchTenantAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.token;
  }

  const appId = getRequiredEnv("FEISHU_APP_ID");
  const appSecret = getRequiredEnv("FEISHU_APP_SECRET");

  const resp = await fetch(`${BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });

  if (!resp.ok) {
    throw new Error(`Feishu token request failed: HTTP ${resp.status}`);
  }

  const data = await resp.json();
  if (data.code !== 0) {
    throw new Error(`Feishu token error: ${data.msg} (code ${data.code})`);
  }

  const token = data.tenant_access_token as string;
  const expire = typeof data.expire === "number" ? data.expire : 7200;
  cachedToken = {
    token,
    expires_at: now + Math.max(expire - 120, 60) * 1000,
  };
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

export interface SearchFilter {
  conjunction?: "and" | "or";
  conditions?: Array<{
    field_name: string;
    operator: string;
    value: unknown[];
  }>;
}

export async function searchBaseRecords(
  tableId: string,
  options: { filter?: SearchFilter; pageSize?: number } = {},
): Promise<FeishuRecord[]> {
  const baseToken = getRequiredEnv("FEISHU_BASE_TOKEN");
  const token = await fetchTenantAccessToken();
  const pageSize = Math.min(options.pageSize ?? 500, 500);

  const url =
    `${BASE_URL}/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/search`;
  const results: FeishuRecord[] = [];
  let pageToken: string | undefined;

  const payload: Record<string, unknown> = { page_size: pageSize };
  if (options.filter) {
    payload.filter = options.filter;
  }

  while (true) {
    const body: Record<string, unknown> = { ...payload };
    if (pageToken) {
      body.page_token = pageToken;
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "Unknown error");
      throw new Error(`Feishu search failed: HTTP ${resp.status} ${text}`);
    }

    const data = await resp.json();
    if (data.code !== 0) {
      throw new Error(`Feishu search error: ${data.msg} (code ${data.code})`);
    }

    const items = (data.data?.items ?? []) as Array<{
      record_id: string;
      fields?: Record<string, unknown>;
    }>;

    for (const item of items) {
      results.push({
        record_id: item.record_id,
        fields: item.fields ?? {},
      });
    }

    pageToken = data.data?.page_token;
    if (!pageToken || items.length === 0) {
      break;
    }
  }

  return results;
}

export async function downloadAttachment(
  fileToken: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; filename: string }> {
  const token = await fetchTenantAccessToken();
  const resp = await fetch(
    `${BASE_URL}/open-apis/drive/v1/medias/${fileToken}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!resp.ok) {
    const text = await resp.text().catch(() => "Unknown error");
    throw new Error(`Feishu download failed: HTTP ${resp.status} ${text}`);
  }

  const contentDisposition = resp.headers.get("content-disposition") ?? "";
  let filename = "certificate";
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  if (match?.[1]) {
    filename = match[1];
  }

  const contentType = resp.headers.get("content-type") ?? "application/octet-stream";
  if (!resp.body) {
    throw new Error("Feishu download returned empty body");
  }

  return {
    stream: resp.body,
    contentType,
    filename,
  };
}

export function getFirstAttachment(
  fields: Record<string, unknown>,
  fieldName: string,
): AttachmentMeta | null {
  const value = fields[fieldName];
  if (!value) return null;

  if (Array.isArray(value) && value.length > 0) {
    return value[0] as AttachmentMeta;
  }
  if (typeof value === "object" && value !== null) {
    return value as AttachmentMeta;
  }
  return null;
}

export function getAttachments(
  fields: Record<string, unknown>,
  fieldName: string,
): AttachmentMeta[] {
  const value = fields[fieldName];
  if (!value) return [];

  if (Array.isArray(value)) {
    return value as AttachmentMeta[];
  }
  if (typeof value === "object" && value !== null) {
    return [value as AttachmentMeta];
  }
  return [];
}

export function firstText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? firstText(value[0]) : "";
  }
  if (typeof value === "object" && value !== null) {
    const text = (value as Record<string, unknown>).text;
    if (text !== undefined && text !== null) {
      return firstText(text);
    }
    return "";
  }
  return String(value);
}

export function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  // Feishu date fields are returned as millisecond timestamps
  if (typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    // Already a string date
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return formatDate(value[0]);
  }
  return "";
}

export function parseIntOrDefault(value: unknown, defaultValue: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : defaultValue;
  }
  if (Array.isArray(value) && value.length > 0) {
    return parseIntOrDefault(value[0], defaultValue);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}
