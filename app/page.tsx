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
  ColumnType,
  detectColumnTypes
} from "./detect-column-types";

type Row = Record<string, any>;

interface ParsedData {
  rows: Row[];
  schema: ColumnSchema[];
}

type TabId = "overview" | "chart" | "table" | "schema";

/* ---------- Excel date helpers ---------- */

function isExcelSerial(serial: any): serial is number {
  return (
    typeof serial === "number" &&
    Number.isFinite(serial) &&
    serial > 25000 &&
    serial < 60000
  );
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue);
}

function formatDateLabel(value: any): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString();
  }

  if (isExcelSerial(value)) {
    const d = excelSerialToDate(value);
    return d.toLocaleDateString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString();
    }
  }

  return String(value);
}

/* ---------- Main component ---------- */

export default function Page() {
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    setFileName(file.name);
    setActiveTab("overview");

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
    } catch (err) {
      console.error(err);
      setError("Failed to read Excel file. Please check the format and try again.");
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const numericColumns = useMemo(
    () => parsed?.schema.filter((c) => c.type === "number") ?? [],
    [parsed]
  );

  const dimensionColumns = useMemo(
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
    const xCol = dimensionColumns[0]?.name ?? Object.keys(parsed.rows[0])[0];

    const dataForChart = parsed.rows.map((row, idx) => {
      let xVal = row[xCol];
      const colType = parsed.schema.find((s) => s.name === xCol)?.type;

      if (colType === "date") {
        xVal = formatDateLabel(xVal);
      }

      return {
        x: xVal || `Row ${idx + 1}`,
        y: toNumber(row[yCol])
      };
    });

    return { xLabel: xCol, yLabel: yCol, data: dataForChart };
  }, [parsed, numericColumns, dimensionColumns]);

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

  const hasData = !!parsed;

  return (
    <div className="flex h-full flex-col gap-5 md:gap-6">
      {/* HERO ROW */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* LEFT: TITLE + UPLOAD */}
        <motion.div
          className="relative holo-card p-5 md:p-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <p className="font-orbitron text-[10px] uppercase tracking-[0.4em] text-cyan-300">
                NEXUS PROTOCOL // DATA OPS
              </p>
              <h1 className="neon-text font-orbitron mt-2 text-xl font-semibold tracking-[0.18em] md:text-2xl">
                EXCEL VISUAL COMMAND CENTER
              </h1>
              <p className="mt-2 text-xs text-slate-200 md:text-sm">
                Stream any spreadsheet into a real-time tactical console. Columns are
                auto-classified as numeric, temporal, boolean or categorical and wired
                into charts, grids and schema overlays.
              </p>
            </div>

            {/* Upload / Dropzone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`group relative mt-1 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center transition
                ${
                  isDragging
                    ? "border-cyan-300 bg-cyan-500/15"
                    : "border-slate-500/60 bg-slate-950/80 hover:border-cyan-300 hover:bg-slate-900/90"
                }`}
            >
              <label
                htmlFor="excel-file-input"
                className="relative flex w-full flex-col items-center gap-3 cursor-pointer"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/80 shadow-[0_0_24px_rgba(34,211,238,0.8)]">
                  <span className="text-2xl">⬇️</span>
                </div>
                <div className="text-sm font-semibold text-slate-50 md:text-base">
                  {isDragging ? "Release to upload" : "Drag & drop your Excel file"}
                </div>
                <div className="text-[11px] text-slate-300">
                  or{" "}
                  <span className="text-cyan-300 underline underline-offset-4">
                    click to select manually
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/80 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  Client-side parsing · No cloud storage
                </div>
              </label>
            </div>

            {/* Hidden file input (triggered by label) */}
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={onInputChange}
              className="hidden"
            />

            {error && (
              <p className="mt-1 text-xs text-rose-300">
                {error}
              </p>
            )}

            {fileName && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                <span className="uppercase tracking-[0.22em] text-slate-400">
                  Active file
                </span>
                <span className="max-w-[200px] truncate text-cyan-200">
                  {fileName}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT: SUMMARY */}
        <motion.div
          className="relative holo-card p-5 md:p-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          <div className="relative z-10 flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-orbitron text-[10px] uppercase tracking-[0.4em] text-emerald-300">
                  TELEMETRY // 02
                </p>
                <h2 className="mt-1 text-sm font-semibold text-slate-50 md:text-base">
                  Dataset diagnostics
                </h2>
                <p className="mt-1 text-xs text-slate-200">
                  Live scan of rows, columns and channel roles. Numeric and temporal
                  fields feed tactical charts; categorical fields fuel grouping and filters.
                </p>
              </div>
              <span className="rounded-full bg-slate-950/90 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                {hasData ? "Signal: Locked" : "Signal: Waiting"}
              </span>
            </div>

            {!parsed && (
              <p className="mt-1 text-xs text-slate-300">
                Once a file is loaded, you&apos;ll see row counts, column roles and a
                breakdown of numeric, temporal and categorical channels here.
              </p>
            )}

            {parsed && summary && (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Rows" value={summary.totalRows.toString()} tone="cyan" />
                  <MiniStat
                    label="Columns"
                    value={parsed.schema.length.toString()}
                    tone="emerald"
                  />
                  <MiniStat
                    label="Numeric"
                    value={summary.byType.number.toString()}
                    tone="fuchsia"
                  />
                  <MiniStat
                    label="Temporal"
                    value={summary.byType.date.toString()}
                    tone="sky"
                  />
                  <MiniStat
                    label="Categories"
                    value={summary.byType.category.toString()}
                    tone="amber"
                  />
                  <MiniStat
                    label="Text"
                    value={summary.byType.text.toString()}
                    tone="slate"
                  />
                </div>

                <div className="mt-2 rounded-2xl bg-black/40 p-3 text-[11px]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Column channels
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.schema.map((col) => (
                      <span
                        key={col.name}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1"
                      >
                        <span className="max-w-[110px] truncate text-[11px] text-slate-100">
                          {col.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-300">
                          {col.type}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* BOTTOM: TABBED CONSOLE */}
      <motion.div
        className="relative holo-card p-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
      >
        {/* Tabs header */}
        <div className="border-b border-cyan-500/35 px-4 pt-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-full bg-slate-950/95 p-1 text-xs">
              <TabButton
                id="overview"
                label="Mission Overview"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <TabButton
                id="chart"
                label="Tactical Chart"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <TabButton
                id="table"
                label="Data Grid"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <TabButton
                id="schema"
                label="Schema Map"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
            {hasData && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                Rows: {parsed!.rows.length} · Columns: {parsed!.schema.length}
              </span>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 pb-4 pt-3 md:px-6 md:pb-5 md:pt-4">
          {!hasData && (
            <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-300 md:text-sm">
              <p className="mb-1 font-medium text-slate-100">
                No data stream attached.
              </p>
              <p className="max-w-md text-slate-300">
                Upload an Excel file above to unlock live charts, a responsive grid and a
                generated schema map.
              </p>
            </div>
          )}

          {hasData && (
            <>
              {activeTab === "overview" && (
                <OverviewTab chartConfig={chartConfig} parsed={parsed!} />
              )}
              {activeTab === "chart" && <ChartTab chartConfig={chartConfig} />}
              {activeTab === "table" && <TableTab parsed={parsed!} />}
              {activeTab === "schema" && <SchemaTab parsed={parsed!} />}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Helpers & subcomponents ---------- */

function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

interface MiniStatProps {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "fuchsia" | "sky" | "amber" | "slate";
}

function MiniStat({ label, value, tone }: MiniStatProps) {
  const toneMap: Record<MiniStatProps["tone"], string> = {
    cyan: "from-cyan-400/20 to-cyan-500/5",
    emerald: "from-emerald-400/20 to-emerald-500/5",
    fuchsia: "from-fuchsia-400/20 to-fuchsia-500/5",
    sky: "from-sky-400/20 to-sky-500/5",
    amber: "from-amber-400/20 to-amber-500/5",
    slate: "from-slate-400/20 to-slate-500/5"
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950/95 p-2.5">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneMap[tone]} opacity-80`}
      />
      <div className="relative">
        <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-50">
          {value}
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  id: TabId;
  label: string;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

function TabButton({ id, label, activeTab, setActiveTab }: TabButtonProps) {
  const isActive = activeTab === id;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`relative rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
        isActive
          ? "bg-cyan-400 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.9)]"
          : "text-slate-300 hover:bg-slate-800/90"
      }`}
    >
      {label}
    </button>
  );
}

/* ---------- Tabs ---------- */

function OverviewTab({
  chartConfig,
  parsed
}: {
  chartConfig: { xLabel: string; yLabel: string; data: any[] } | null;
  parsed: ParsedData;
}) {
  return (
    <div className="grid h-full gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-300">
          You&apos;re viewing a mission overview for this dataset. We scanned the first
          sheet, inferred channel roles and built a tactical chart from numeric and
          temporal data.
        </p>

        <div className="flex flex-wrap gap-3 text-xs">
          <Badge>
            Rows: <span className="font-semibold text-cyan-300">{parsed.rows.length}</span>
          </Badge>
          <Badge>
            Columns:{" "}
            <span className="font-semibold text-cyan-300">
              {parsed.schema.length}
            </span>
          </Badge>
          <Badge>
            Numeric fields:{" "}
            <span className="font-semibold text-emerald-300">
              {parsed.schema.filter((c) => c.type === "number").length}
            </span>
          </Badge>
          <Badge>
            Date fields:{" "}
            <span className="font-semibold text-sky-300">
              {parsed.schema.filter((c) => c.type === "date").length}
            </span>
          </Badge>
        </div>

        <div className="mt-2 flex-1 rounded-2xl bg-slate-900/90 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tactical snapshot
          </p>
          {!chartConfig && (
            <p className="text-xs text-slate-300">
              No numeric column found to chart. Try another file with at least one numeric
              field to see a live mission chart.
            </p>
          )}
          {chartConfig && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartConfig.data}>
                  <defs>
                    <linearGradient id="overviewColorY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
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
                      background: "rgba(15,23,42,0.98)",
                      borderRadius: 12,
                      border: "1px solid rgba(56,189,248,0.4)",
                      padding: "8px 10px"
                    }}
                    labelStyle={{ fontSize: 11, color: "#e5e7eb" }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    name={chartConfig.yLabel}
                    stroke="#22d3ee"
                    fill="url(#overviewColorY)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-slate-900/90 p-3 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Channel roles
        </p>
        <p className="text-slate-300">
          Columns are classified as numeric, temporal, boolean, categorical or text. Use
          this as a blueprint for downstream dashboards, APIs or game logic.
        </p>
        <div className="mt-1 max-h-52 space-y-1 overflow-auto rounded-xl bg-black/75 p-2">
          {parsed.schema.map((col) => (
            <div
              key={col.name}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <div className="flex flex-col">
                <span className="max-w-[160px] truncate text-slate-100">
                  {col.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Sample:{" "}
                  <span className="text-slate-200">
                    {String(parsed.rows[0]?.[col.name] ?? "—")}
                  </span>
                </span>
              </div>
              <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-300">
                {col.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartTab({
  chartConfig
}: {
  chartConfig: { xLabel: string; yLabel: string; data: any[] } | null;
}) {
  if (!chartConfig) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-300 md:text-sm">
        No numeric column available to chart. Try another file with numeric data.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tactical chart
          </p>
          <p className="text-slate-200">
            {chartConfig.yLabel} vs {chartConfig.xLabel}
          </p>
        </div>
        <p className="max-w-xs text-[11px] text-slate-400">
          A live waveform built from your spreadsheet. Hover to inspect data points or
          switch tabs to explore other views.
        </p>
      </div>

      <div className="flex-1 rounded-2xl bg-slate-900/90 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartConfig.data}>
            <defs>
              <linearGradient id="detailColorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
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
            <YAxis stroke="#e5e7eb" tick={{ fontSize: 10 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.98)",
                borderRadius: 12,
                border: "1px solid rgba(34,197,94,0.4)",
                padding: "8px 10px"
              }}
              labelStyle={{ fontSize: 11, color: "#e5e7eb" }}
              itemStyle={{ fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} />
            <Area
              type="monotone"
              dataKey="y"
              name={chartConfig.yLabel}
              stroke="#22c55e"
              fill="url(#detailColorY)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TableTab({ parsed }: { parsed: ParsedData }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Data grid
      </p>
      <div className="relative flex-1 overflow-auto rounded-2xl bg-slate-900/90">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur">
            <tr>
              {parsed.schema.map((col) => (
                <th
                  key={col.name}
                  className="border-b border-cyan-500/30 px-3 py-2 text-left font-medium text-slate-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.name}</span>
                    <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-300">
                      {col.type}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.slice(0, 80).map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900/30"}
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
        {parsed.rows.length > 80 && (
          <div className="sticky bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-right text-[10px] text-slate-400">
            Showing 80 of {parsed.rows.length} rows
          </div>
        )}
      </div>
    </div>
  );
}

function SchemaTab({ parsed }: { parsed: ParsedData }) {
  return (
    <div className="grid h-full gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/90 p-3 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Column manifest
        </p>
        <div className="mt-1 max-h-full space-y-1 overflow-auto rounded-xl bg-black/80 p-2">
          {parsed.schema.map((col) => (
            <div
              key={col.name}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <div className="flex flex-col">
                <span className="max-w-[160px] truncate text-slate-100">
                  {col.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Sample:{" "}
                  <span className="text-slate-200">
                    {String(parsed.rows[0]?.[col.name] ?? "—")}
                  </span>
                </span>
              </div>
              <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-300">
                {col.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/90 p-3 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Type sketch
        </p>
        <p className="text-slate-300">
          Conceptual TypeScript-style row shape based on inferred column roles. Use this to
          wire APIs, forms or game logic.
        </p>
        <pre className="mt-2 flex-1 overflow-auto rounded-xl bg-black/85 p-3 text-[11px] text-emerald-200">
{`{
  rows: Array<{
${parsed.schema
  .map((c) => `    "${c.name}": ${tsTypeForColumn(c.type)};`)
  .join("\n")}
  }>;
}`}
        </pre>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200">
      {children}
    </span>
  );
}

function tsTypeForColumn(type: ColumnType): string {
  switch (type) {
    case "number":
      return "number | string";
    case "date":
      return "string | Date | number";
    case "boolean":
      return "boolean | string | number";
    case "category":
    case "text":
    default:
      return "string";
  }
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
    const label = formatDateLabel(value);
    return (
      <span className="font-mono text-[11px] text-sky-300">
        {label}
      </span>
    );
  }

  if (type === "category") {
    return (
      <span className="inline-flex max-w-[180px] items-center truncate rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-100">
        {String(value)}
      </span>
    );
  }

  return (
    <span className="block max-w-[260px] truncate text-[11px] text-slate-100">
      {String(value)}
    </span>
  );
}
