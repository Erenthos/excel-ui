"use client";

import React, { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ColumnSchema,
  detectColumnTypes,
  ColumnType
} from "./detect-column-types";

type Row = Record<string, any>;

interface ParsedData {
  rows: Row[];
  schema: ColumnSchema[];
}

export default function Page() {
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json: Row[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: true
      });

      if (!json || json.length === 0) {
        setError("No rows found in the first sheet.");
        return;
      }

      const schema = detectColumnTypes(json);
      setParsed({ rows: json, schema });
    } catch (err: any) {
      console.error(err);
      setError("Failed to read Excel file. Please check the format and try again.");
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const numericColumns = useMemo(
    () => parsed?.schema.filter((c) => c.type === "number") ?? [],
    [parsed]
  );

  const dateOrCategoryColumns = useMemo(
    () =>
      parsed?.schema.filter(
        (c) => c.type === "date" || c.type === "category" || c.type === "text"
      ) ?? [],
    [parsed]
  );

  const chartConfig = useMemo(() => {
    if (!parsed || parsed.rows.length === 0) return null;
    if (numericColumns.length === 0) return null;

    const yCol = numericColumns[0].name;
    const xCol = dateOrCategoryColumns[0]?.name ?? Object.keys(parsed.rows[0])[0];

    const dataForChart = parsed.rows.map((row, idx) => {
      let xVal = row[xCol];

      if (parsed.schema.find((s) => s.name === xCol)?.type === "date") {
        const d = new Date(xVal);
        if (!Number.isNaN(d.getTime())) {
          xVal = d.toISOString().slice(0, 10);
        }
      }

      return {
        x: xVal || `Row ${idx + 1}`,
        y: toNumber(row[yCol])
      };
    });

    return {
      xLabel: xCol,
      yLabel: yCol,
      data: dataForChart
    };
  }, [parsed, numericColumns, dateOrCategoryColumns]);

  const summary = useMemo(() => {
    if (!parsed) return null;

    const totalRows = parsed.rows.length;
    const byType: Record<ColumnType, number> = {
      number: 0,
      date: 0,
      boolean: 0,
      category: 0,
      text: 0
    };

    for (const col of parsed.schema) {
      byType[col.type] += 1;
    }

    return { totalRows, byType };
  }, [parsed]);

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      {/* LEFT: Upload + schema info */}
      <motion.div
        className="flex w-full flex-col gap-4 lg:w-1/3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <label
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`group relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/20 p-6 text-center transition
            ${isDragging ? "border-accent-soft bg-white/5" : "bg-white/5 hover:bg-white/10"}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-orbit opacity-40" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black/60 shadow-soft">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold">
              Drop your Excel file here
            </h2>
            <p className="text-xs text-slate-200/80">
              .xlsx or .xls · First sheet will be analyzed · No upload to server by default
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-1 text-xs text-slate-200/90 shadow-soft">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Status
              </span>
              <span className="font-medium text-slate-100">
                {parsed
                  ? "Data loaded"
                  : isDragging
                  ? "Drop to analyze"
                  : "Waiting for file"}
              </span>
            </div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onInputChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <motion.div
          className="glass relative rounded-2xl p-4 text-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                File details
              </span>
              {fileName && (
                <span className="max-w-[60%] truncate text-xs text-slate-200">
                  {fileName}
                </span>
              )}
            </div>

            {!parsed && !error && (
              <p className="mt-1 text-xs text-slate-300">
                Upload an Excel file to see automatic column type detection and
                visual insights. A sample file can be placed at{" "}
                <code className="rounded bg-black/40 px-1 py-0.5 text-[10px]">
                  /public/sample.xlsx
                </code>{" "}
                for testing.
              </p>
            )}

            {error && (
              <p className="mt-1 text-xs text-red-300">
                {error}
              </p>
            )}

            {parsed && summary && (
              <div className="mt-1 grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
                <StatChip label="Rows" value={summary.totalRows.toString()} />
                <StatChip
                  label="Numeric cols"
                  value={summary.byType.number.toString()}
                />
                <StatChip
                  label="Dates"
                  value={summary.byType.date.toString()}
                />
                <StatChip
                  label="Categories"
                  value={summary.byType.category.toString()}
                />
                <StatChip
                  label="Boolean"
                  value={summary.byType.boolean.toString()}
                />
                <StatChip
                  label="Text cols"
                  value={summary.byType.text.toString()}
                />
              </div>
            )}

            {parsed && (
              <div className="mt-3 rounded-xl bg-black/40 p-3 text-xs">
                <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Column schema
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.schema.map((col) => (
                    <span
                      key={col.name}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1"
                    >
                      <span className="text-[11px] font-medium text-slate-100">
                        {col.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        {col.type}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT: Visualization + table */}
      <motion.div
        className="flex w-full flex-1 flex-col gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="glass relative h-64 rounded-3xl p-4 md:h-72"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Data pulse
                </p>
                <h2 className="text-sm font-medium text-slate-100 md:text-base">
                  Auto-generated insight chart
                </h2>
              </div>
            </div>

            <div className="flex-1">
              {!chartConfig && (
                <div className="flex h-full items-center justify-center text-xs text-slate-300">
                  {parsed
                    ? "No numeric columns detected to visualize. Try another file with numbers."
                    : "Upload an Excel file to generate an interactive chart."}
                </div>
              )}

              {chartConfig && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartConfig.data}>
                    <defs>
                      <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="x"
                      stroke="#e5e7eb"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#e5e7eb"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.95)",
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.4)",
                        padding: "8px 10px"
                      }}
                      labelStyle={{ fontSize: 11, color: "#e5e7eb" }}
                      itemStyle={{ fontSize: 11 }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      iconSize={8}
                    />
                    <Area
                      type="monotone"
                      dataKey="y"
                      name={chartConfig.yLabel}
                      stroke="#818cf8"
                      fill="url(#colorY)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass relative flex-1 overflow-hidden rounded-3xl p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Raw grid
                </p>
                <h2 className="text-sm font-medium text-slate-100 md:text-base">
                  First 50 rows of your data
                </h2>
              </div>
            </div>

            {!parsed && (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-300">
                Upload an Excel file to see a live, scrollable view of your data.
              </div>
            )}

            {parsed && (
              <div className="relative mt-1 flex-1 overflow-auto rounded-2xl bg-black/40">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-900/90 backdrop-blur">
                    <tr>
                      {parsed.schema.map((col) => (
                        <th
                          key={col.name}
                          className="border-b border-white/10 px-3 py-2 text-left font-medium text-slate-100"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col.name}</span>
                            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                              {col.type}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 50).map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}
                      >
                        {parsed.schema.map((col) => (
                          <td
                            key={col.name}
                            className="border-b border-white/5 px-3 py-2 align-top text-slate-100/90"
                          >
                            <CellContent value={row[col.name]} type={col.type} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 50 && (
                  <div className="sticky bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-right text-[10px] text-slate-400">
                    Showing 50 of {parsed.rows.length} rows
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/50 p-2 shadow-soft">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function CellContent({ value, type }: { value: any; type: ColumnType }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-500/80">—</span>;
  }

  if (type === "number") {
    const num = toNumber(value);
    return (
      <span className="font-mono text-[11px] text-emerald-300">
        {num.toLocaleString()}
      </span>
    );
  }

  if (type === "boolean") {
    const v =
      typeof value === "string" ? value.trim().toLowerCase() : String(value);
    const truthy = ["true", "yes", "y", "1"].includes(v);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          truthy
            ? "bg-emerald-500/20 text-emerald-200"
            : "bg-rose-500/20 text-rose-200"
        }`}
      >
        {truthy ? "TRUE" : "FALSE"}
      </span>
    );
  }

  if (type === "date") {
    const d = new Date(value);
    const label = Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString();
    return (
      <span className="font-mono text-[11px] text-sky-300">
        {label}
      </span>
    );
  }

  if (type === "category") {
    return (
      <span className="inline-flex max-w-[160px] items-center truncate rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-100">
        {String(value)}
      </span>
    );
  }

  return (
    <span className="block max-w-[220px] truncate text-[11px] text-slate-100">
      {String(value)}
    </span>
  );
}

