// app/detect-column-types.ts

export type ColumnType = "number" | "date" | "boolean" | "category" | "text";

export interface ColumnSchema {
  name: string;
  type: ColumnType;
}

function isNumeric(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  if (typeof value === "number") {
    return !Number.isNaN(value) && Number.isFinite(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const num = Number(trimmed.replace(/,/g, ""));
    return !Number.isNaN(num) && Number.isFinite(num);
  }

  return false;
}

function isBooleanLike(value: unknown): boolean {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return value === 0 || value === 1;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return ["true", "false", "yes", "no", "y", "n", "0", "1"].includes(v);
  }

  return false;
}

function isDateLike(value: unknown): boolean {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const parsed = Date.parse(trimmed);
    return !Number.isNaN(parsed);
  }

  // Excel often stores dates as serial numbers; you may extend this if needed.
  return false;
}

export function detectColumnTypes(rows: Record<string, unknown>[]): ColumnSchema[] {
  if (!rows || rows.length === 0) return [];

  const sampleSize = Math.min(rows.length, 50);
  const columnNames = Object.keys(rows[0] ?? {});

  const schemas: ColumnSchema[] = columnNames.map((col) => {
    const sampleValues: unknown[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i]?.[col];
      if (value !== null && value !== undefined && value !== "") {
        sampleValues.push(value);
      }
    }

    if (sampleValues.length === 0) {
      return { name: col, type: "text" };
    }

    const numericCount = sampleValues.filter(isNumeric).length;
    const booleanCount = sampleValues.filter(isBooleanLike).length;
    const dateCount = sampleValues.filter(isDateLike).length;

    const uniqueValues = new Set(
      sampleValues
        .map((v) => (typeof v === "string" ? v.trim() : v))
        .filter((v) => v !== "" && v !== null && v !== undefined)
    );
    const uniqueRatio = uniqueValues.size / sampleValues.length;

    let type: ColumnType = "text";

    // Priority: numeric, date, boolean, category, text
    if (numericCount / sampleValues.length > 0.7) {
      type = "number";
    } else if (dateCount / sampleValues.length > 0.6) {
      type = "date";
    } else if (booleanCount / sampleValues.length > 0.6) {
      type = "boolean";
    } else if (uniqueValues.size <= 20 && uniqueRatio < 0.7) {
      // few repeating values → good for filters, legends, grouping
      type = "category";
    } else {
      type = "text";
    }

    return { name: col, type };
  });

  return schemas;
}

