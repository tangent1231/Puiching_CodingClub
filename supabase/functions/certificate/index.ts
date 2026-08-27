import { CORS_HEADERS, errorResponse } from "../_shared/cors.ts";
import {
  downloadAttachment,
  getFirstAttachment,
  isFeishuConfigured,
  searchBaseRecords,
} from "../_shared/feishu.ts";

const TABLE_AWARDS = "tblz5yriuusSS0Bx";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const recordId = url.searchParams.get("recordId");
  const fileToken = url.searchParams.get("fileToken");

  if (!recordId && !fileToken) {
    return errorResponse("Missing recordId or fileToken", 400);
  }

  try {
    if (!isFeishuConfigured()) {
      return errorResponse("Feishu credentials not configured", 503);
    }

    let targetFileToken = fileToken;

    if (!targetFileToken && recordId) {
      const records = await searchBaseRecords(TABLE_AWARDS);
      const record = records.find((r) => r.record_id === recordId);
      if (!record) {
        return errorResponse("Record not found", 404);
      }
      const attachment = getFirstAttachment(record.fields, "证书附件") ??
        getFirstAttachment(record.fields, "證書附件");
      if (!attachment) {
        return errorResponse("Certificate attachment not found", 404);
      }
      targetFileToken = attachment.file_token;
    }

    if (!targetFileToken) {
      return errorResponse("Certificate file token not found", 404);
    }

    const { stream, contentType, filename } = await downloadAttachment(targetFileToken);

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("certificate error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
