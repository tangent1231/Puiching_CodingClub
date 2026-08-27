import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { verifyAdmin } from "../_shared/auth.ts";
import {
  firstText,
  formatDate,
  getCheckbox,
  getFirstAttachment,
  isFeishuConfigured,
  searchBaseRecords,
  updateBaseRecord,
} from "../_shared/feishu.ts";

const TABLE_AWARDS = "tblz5yriuusSS0Bx";

interface AwardOut {
  record_id: string;
  name: string;
  class_name: string;
  competition: string;
  award: string;
  date: string;
  has_certificate: boolean;
  visible: boolean;
}

function parseAward(record: { record_id: string; fields: Record<string, unknown> }): AwardOut {
  const fields = record.fields;
  const attachment = getFirstAttachment(fields, "证书附件") ?? getFirstAttachment(fields, "證書附件");
  return {
    record_id: record.record_id,
    name: firstText(fields["姓名 2"]) || firstText(fields["姓名"]),
    class_name: firstText(fields["班级"]) || firstText(fields["班級"]),
    competition: firstText(fields["竞赛名称"]) || firstText(fields["競賽名稱"]),
    award: firstText(fields["奖项"]) || firstText(fields["獎項"]),
    date: formatDate(fields["获奖日期"]) || formatDate(fields["日期"]),
    has_certificate: Boolean(attachment),
    visible: getCheckbox(fields["显示记录"]),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const { response: authError } = await verifyAdmin(req);
  if (authError) {
    return authError;
  }

  try {
    if (!isFeishuConfigured()) {
      return errorResponse("Feishu not configured", 503);
    }

    if (req.method === "GET") {
      const records = await searchBaseRecords(TABLE_AWARDS);
      return jsonResponse(records.map(parseAward));
    }

    if (req.method === "PUT" || req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const recordId = body.record_id;
      const visible = body.visible;

      if (!recordId || typeof visible !== "boolean") {
        return errorResponse("Missing record_id or visible", 400);
      }

      await updateBaseRecord(TABLE_AWARDS, recordId, { "显示记录": visible });
      return jsonResponse({ ok: true, record_id: recordId, visible });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("award-review error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
