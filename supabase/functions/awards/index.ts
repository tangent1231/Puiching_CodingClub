import { CORS_HEADERS, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  firstText,
  formatDate,
  getCheckbox,
  getFirstAttachment,
  isFeishuConfigured,
  searchBaseRecords,
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
}

const MOCK_AWARDS: AwardOut[] = [
  { record_id: "1", name: "陳子軒", class_name: "F5A", competition: "澳門中學生程式設計競賽", award: "金獎", date: "2024-05-18", has_certificate: true },
  { record_id: "2", name: "林嘉欣", class_name: "F5B", competition: "澳門中學生程式設計競賽", award: "銀獎", date: "2024-05-18", has_certificate: true },
  { record_id: "3", name: "黃偉豪", class_name: "F4C", competition: "校際電腦奧林匹克", award: "一等獎", date: "2024-03-10", has_certificate: true },
  { record_id: "4", name: "張曉雯", class_name: "F6A", competition: "粵港澳青少年創客大賽", award: "二等獎", date: "2024-07-22", has_certificate: true },
  { record_id: "5", name: "李俊傑", class_name: "F5A", competition: "全澳資訊科技周編程比賽", award: "優異獎", date: "2023-11-05", has_certificate: true },
  { record_id: "6", name: "王美琪", class_name: "F4B", competition: "校際電腦奧林匹克", award: "二等獎", date: "2023-03-12", has_certificate: true },
  { record_id: "7", name: "劉柏宏", class_name: "F6B", competition: "澳門中學生程式設計競賽", award: "銅獎", date: "2023-05-20", has_certificate: true },
  { record_id: "8", name: "周詩敏", class_name: "F5C", competition: "粵港澳青少年創客大賽", award: "三等獎", date: "2023-07-15", has_certificate: true },
];

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
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  try {
    if (!isFeishuConfigured()) {
      const term = q.toLowerCase();
      return jsonResponse(
        MOCK_AWARDS.filter((a) => !term || a.name.toLowerCase().includes(term)),
      );
    }

    const filter = q
      ? {
          conjunction: "and" as const,
          conditions: [
            {
              field_name: "姓名",
              operator: "contains",
              value: [q],
            },
          ],
        }
      : undefined;

    const records = await searchBaseRecords(TABLE_AWARDS, { filter });
    const awards = records.map(parseAward).filter((a) => a.visible);
    return jsonResponse(awards);
  } catch (err) {
    console.error("awards error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 502);
  }
});
