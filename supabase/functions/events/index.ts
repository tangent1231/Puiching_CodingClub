import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  firstText,
  formatDate,
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
  link_url: string;
}

const MOCK_EVENTS: EventOut[] = [
  { record_id: "e1", title: "2024 澳門中學生程式設計競賽", status: "報名進行中", date: "2024-09-15", description: "報名截止：2024-09-15", link_url: "" },
  { record_id: "e2", title: "校際電腦奧林匹克初賽", status: "即將舉行", date: "2024-10-12", description: "比賽日期：2024-10-12", link_url: "" },
];

function computeStatus(regDeadlineValue: unknown, eventDateValue: unknown): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const regDeadlineStr = formatDate(regDeadlineValue);
  const eventDateStr = formatDate(eventDateValue);

  const regDeadline = regDeadlineStr ? new Date(regDeadlineStr) : null;
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;

  if (regDeadline) {
    regDeadline.setHours(23, 59, 59, 999);
  }

  if (eventDate) {
    eventDate.setHours(23, 59, 59, 999);
  }

  if (regDeadline && today <= regDeadline) {
    return "报名进行中";
  }
  if (eventDate && today >= eventDate) {
    return "已结束";
  }
  return "即将举行";
}

function parseEvent(record: { record_id: string; fields: Record<string, unknown> }): EventOut {
  const fields = record.fields;
  const regDeadline = fields["报名截止日期"];
  const eventDate = fields["活动日期"] || fields["日期"];
  const manualStatus = firstText(fields["状态"]) || firstText(fields["狀態"]);
  const autoStatus = computeStatus(regDeadline, eventDate);

  // Prefer manual status if it is "已结束" and auto says otherwise, otherwise use auto.
  const status = manualStatus === "已结束" || manualStatus === "已結束" ? manualStatus : autoStatus;

  return {
    record_id: record.record_id,
    title: firstText(fields["标题"]) || firstText(fields["標題"]) || firstText(fields["活動名稱"]),
    status,
    date: formatDate(eventDate),
    description: firstText(fields["描述"]),
    link_url: firstText(fields["链接"]) || firstText(fields["鏈接"]) || firstText(fields["详情链接"]) || firstText(fields["詳情鏈接"]),
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
