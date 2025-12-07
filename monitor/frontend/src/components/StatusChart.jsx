import React, { useMemo, useContext } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { ThemeContext } from "../context/ThemeContext";

// Accept a prop rangeHours (0.5, 3, 24). Default 3h.
export default function StatusChart({ statuses, rangeHours = 3 }) {
  const { darkMode } = useContext(ThemeContext);

  const { data, yAxisMax, outliers } = useMemo(() => {
    if (!Array.isArray(statuses) || statuses.length === 0) return { data: [], yAxisMax: 'auto', outliers: [] };
    const sorted = [...statuses].sort((a, b) => a.checked_at - b.checked_at);

    const cutoffMs = Date.now() - rangeHours * 60 * 60 * 1000;
    let recent = sorted.filter((s) => s.checked_at * 1000 >= cutoffMs);
    if (recent.length === 0) recent = sorted.slice(-100);

    // Map into chart data
    const chartData = recent.map((s) => ({
      ts: s.checked_at * 1000,
      response: s.is_up ? s.response_time_ms : null,
      code: s.status_code ?? "N/A",
      is_up: !!s.is_up,
    }));

    // Calculate smart Y-axis scaling
    const validResponses = chartData.filter(d => d.response !== null).map(d => d.response);
    if (validResponses.length === 0) return { data: chartData, yAxisMax: 'auto', outliers: [] };

    const sortedResponses = [...validResponses].sort((a, b) => a - b);
    const q75Index = Math.floor(sortedResponses.length * 0.75);
    const q75 = sortedResponses[q75Index] || sortedResponses[sortedResponses.length - 1];
    const maxNormal = Math.max(q75, sortedResponses[sortedResponses.length - 1]);
    const smartMax = Math.ceil(maxNormal * 1.2);
    
    // Find outliers (responses > 3x the 75th percentile)
    const outlierThreshold = q75 * 3;
    const outlierPoints = chartData.filter(d => d.response && d.response > outlierThreshold);
    
    return { 
      data: chartData, 
      yAxisMax: smartMax,
      outliers: outlierPoints
    };
  }, [statuses, rangeHours]);

  // Build downtime ranges for shading
  const downtimeRanges = useMemo(() => {
    const ranges = [];
    let currentStart = null;
    data.forEach((point, idx) => {
      if (!point.is_up && currentStart === null) {
        currentStart = point.ts;
      }
      if (point.is_up && currentStart !== null) {
        ranges.push([currentStart, point.ts]);
        currentStart = null;
      }
    });
    if (currentStart !== null) {
      ranges.push([currentStart, data[data.length - 1].ts]);
    }
    return ranges;
  }, [data]);

  const gridColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const tickColor = darkMode ? "#E5E7EB" : "#374151";
  const lineColor = darkMode ? "#60A5FA" : "#2563EB";

  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
          No data available
        </p>
      </div>
    );
  }

  const cardCls = [
    "rounded-lg p-3 h-80",
    darkMode ? "bg-gray-800/60" : "bg-white"
  ].join(" ");

  return (
    <div className={cardCls}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="respGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Shade downtime ranges */}
          {downtimeRanges.map(([start, end], i) => (
            <ReferenceArea
              key={i}
              x1={start}
              x2={end}
              y1={0}
              y2="auto"
              fill="rgba(255,0,0,0.08)"
              stroke="none"
            />
          ))}

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

          <XAxis
            dataKey="ts"
            minTickGap={40}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickFormatter={(t) =>
              new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
            interval="preserveStartEnd"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
          />

          <YAxis
            tick={{ fill: tickColor, fontSize: 12 }}
            stroke={gridColor}
            domain={[0, yAxisMax]}
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#111827" : "#ffffff",
              border: "none",
              borderRadius: 8,
              color: darkMode ? "#e5e7eb" : "#111827",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
            labelFormatter={(ts) => new Date(ts).toLocaleString()}
            formatter={(value, _, obj) => {
              if (value == null) return ["Offline", "Status"];
              const isOutlier = outliers.some(o => o.ts === obj.payload.ts);
              return isOutlier 
                ? [`${value} ms ⚠️ Spike`, "Response"]
                : [`${value} ms`, "Response"];
            }}
          />

          <Line
            type="monotone"
            dataKey="response"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            fillOpacity={1}
            fill="url(#respGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
