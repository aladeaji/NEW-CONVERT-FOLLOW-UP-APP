export interface ImportRow {
  line: number;
  fullName: string;
  phone: string;
  personType: string;
  visitDate: string;
  ageGroup?: string;
  gender?: string;
  area?: string;
  howCame?: string;
  notes?: string;
  error?: string;
}

const HEADERS: Record<string, keyof ImportRow> = {
  fullname: "fullName",
  name: "fullName",
  phone: "phone",
  phonenumber: "phone",
  persontype: "personType",
  type: "personType",
  visitdate: "visitDate",
  date: "visitDate",
  agegroup: "ageGroup",
  age: "ageGroup",
  gender: "gender",
  area: "area",
  location: "area",
  howcame: "howCame",
  notes: "notes",
  note: "notes",
};

const TYPES: Record<string, string> = {
  "new convert": "NEW_CONVERT",
  new_convert: "NEW_CONVERT",
  "first-time": "FIRST_TIME_VISITOR",
  "first time": "FIRST_TIME_VISITOR",
  first_time_visitor: "FIRST_TIME_VISITOR",
  returning: "RETURNING_VISITOR",
  returning_visitor: "RETURNING_VISITOR",
  member: "EXISTING_MEMBER",
  existing_member: "EXISTING_MEMBER",
};

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parsePeopleCsv(text: string, maxRows = 500): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) throw new Error("CSV needs a header row plus data rows.");
  const cols = splitCsv(lines[0]).map(
    (h) => HEADERS[h.toLowerCase().replace(/[\s_-]/g, "")] ?? null,
  );
  if (!cols.includes("fullName") || !cols.includes("phone") || !cols.includes("visitDate"))
    throw new Error(
      "Header must include name, phone, and visit/conversion date columns.",
    );

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length && rows.length < maxRows; i++) {
    const cells = splitCsv(lines[i]);
    const get = (key: keyof ImportRow) => {
      const idx = cols.indexOf(key);
      return idx >= 0 ? (cells[idx] ?? "") : "";
    };
    const typeRaw = get("personType").toLowerCase();
    const visitRaw = get("visitDate");
    const row: ImportRow = {
      line: i + 1,
      fullName: get("fullName"),
      phone: get("phone").replace(/[\s-]/g, ""),
      personType: TYPES[typeRaw] ?? "NEW_CONVERT",
      visitDate: visitRaw,
      ageGroup: get("ageGroup") || undefined,
      gender: get("gender") || undefined,
      area: get("area") || undefined,
      howCame: get("howCame") || undefined,
      notes: get("notes") || undefined,
    };
    if (!row.fullName) row.error = "Missing name.";
    else if (!row.phone) row.error = "Missing phone.";
    else if (!visitRaw || Number.isNaN(Date.parse(visitRaw)))
      row.error = "Bad visit date.";
    rows.push(row);
  }
  return rows;
}
