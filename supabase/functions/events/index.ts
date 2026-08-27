import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  firstText,
  isFeishuConfigured,
  searchBaseRecords,
} from "../_shared/feishu.ts";

const TABLE_EVENTS = "tblSq9j0n3qCCCC4";

interface EventOut {
  record_id: string;
  title: string;
  status: string;
  date: string;
  description: string;
}

const MOCK_EVENTS: EventOut[] = [
  { record_id: "e1", title: "2024 澳門中學生程式設計競賽", status: "報名進行中", date: "2024-09-15", description: "報名截止：2024-09-15" },
  { record_id: "e2", title: "校際電腦奧林匹克初賽", status: "即將舉行", date: "2024-10-12", description: "比賽日期：2024-10-12" },
];

function parseEvent(record: { record_id: string; fields: Record<string, unknown> }): EventOut {
  const fields = record.fields;
  return {
    record_id: record.record_id,
    title: firstText(fields["活動名稱"]) || firstText(fields["標題"]),
    status: firstText(fields["狀態"]) || "即將舉行",
    date: firstText(fields["日期"]),
    description: firstText(fields["描述"]),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    if (!isFeishuConfigured()) {
      return jsonResponse(MOCK_EVENTS);
    }

    const records = await searchBaseRecords(TABLE_EVENTS);
    return jsonResponse(records.map(parseEvent));
  } catch (err) {
    console.error("events error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
