import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
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

function parsePhoto(record: { record_id: string; fields: Record<string, unknown> }): PhotoOut {
  const fields = record.fields;
  const attachment = getFirstAttachment(fields, "照片附件");
  let imageUrl = attachment?.url ?? "";
  if (!imageUrl && attachment?.file_token) {
    imageUrl = `/api/photos/${record.record_id}/image`;
  }
  return {
    record_id: record.record_id,
    year: parseIntOrDefault(fields["年份"], 2024),
    title: firstText(fields["標題"]),
    image_url: imageUrl,
    order: parseIntOrDefault(fields["顯示順序"], 0),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");

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
    const photos = records.map(parsePhoto);
    return jsonResponse(photos.sort((a, b) => (a.year - b.year) || (a.order - b.order)));
  } catch (err) {
    console.error("photos error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
