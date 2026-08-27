import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  downloadAttachment,
  firstText,
  getFirstAttachment,
  isFeishuConfigured,
  parseIntOrDefault,
  searchBaseRecords,
} from "../_shared/feishu.ts";

const TABLE_PHOTOS = "tblAffWQi5HBxAcA";

interface PhotoOut {
  record_id: string;
  year: number;
  title: string;
  image_url: string;
  order: number;
}

const MOCK_PHOTOS: PhotoOut[] = [
  { record_id: "p1", year: 2024, title: "編程工作坊 · 2024.03", image_url: "/activity-1.jpg", order: 1 },
  { record_id: "p2", year: 2024, title: "校際比賽 · 2024.05", image_url: "/activity-2.jpg", order: 2 },
  { record_id: "p3", year: 2023, title: "暑期集訓營 · 2023.08", image_url: "/activity-3.jpg", order: 1 },
];

function getProxyImageUrl(reqUrl: URL, recordId: string, fileToken: string): string {
  const base = `${reqUrl.protocol}//${reqUrl.host}`;
  return `${base}/functions/v1/photos/image?recordId=${encodeURIComponent(recordId)}&fileToken=${encodeURIComponent(fileToken)}`;
}

function parsePhoto(record: { record_id: string; fields: Record<string, unknown> }, reqUrl: URL): PhotoOut {
  const fields = record.fields;
  const attachment = getFirstAttachment(fields, "照片附件");
  let imageUrl = "";
  if (attachment?.file_token) {
    imageUrl = getProxyImageUrl(reqUrl, record.record_id, attachment.file_token);
  } else if (attachment?.url) {
    imageUrl = attachment.url;
  }
  return {
    record_id: record.record_id,
    year: parseIntOrDefault(fields["年份"], 2024),
    title: firstText(fields["标题"]) || firstText(fields["標題"]),
    image_url: imageUrl,
    order: parseIntOrDefault(fields["显示顺序"], parseIntOrDefault(fields["顯示順序"], 0)),
  };
}

async function serveImage(recordId?: string | null, fileToken?: string | null): Promise<Response> {
  if (!isFeishuConfigured()) {
    return errorResponse("Feishu credentials not configured", 503);
  }
  if (!recordId && !fileToken) {
    return errorResponse("Missing recordId or fileToken", 400);
  }

  try {
    let targetFileToken = fileToken;

    if (!targetFileToken && recordId) {
      const records = await searchBaseRecords(TABLE_PHOTOS);
      const record = records.find((r) => r.record_id === recordId);
      if (!record) {
        return errorResponse("Record not found", 404);
      }
      const attachment = getFirstAttachment(record.fields, "照片附件");
      if (!attachment) {
        return errorResponse("Photo attachment not found", 404);
      }
      targetFileToken = attachment.file_token;
    }

    if (!targetFileToken) {
      return errorResponse("Photo file token not found", 404);
    }

    const { stream, contentType, filename } = await downloadAttachment(targetFileToken);
    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("photo image error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const pathname = url.pathname;
  const yearParam = url.searchParams.get("year");

  // Image proxy: /functions/v1/photos/image
  if (pathname === "/image" || pathname.endsWith("/image")) {
    return serveImage(url.searchParams.get("recordId"), url.searchParams.get("fileToken"));
  }

  try {
    if (!isFeishuConfigured()) {
      let photos = MOCK_PHOTOS;
      if (yearParam !== null) {
        const year = parseInt(yearParam, 10);
        photos = photos.filter((p) => p.year === year);
      }
      return jsonResponse(photos.sort((a, b) => (a.year - b.year) || (a.order - b.order)));
    }

    const filter = yearParam !== null
      ? {
          conjunction: "and" as const,
          conditions: [
            {
              field_name: "年份",
              operator: "is",
              value: [yearParam],
            },
          ],
        }
      : undefined;

    const records = await searchBaseRecords(TABLE_PHOTOS, { filter });
    const photos = records.map((r) => parsePhoto(r, url));
    return jsonResponse(photos.sort((a, b) => (a.year - b.year) || (a.order - b.order)));
  } catch (err) {
    console.error("photos error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
