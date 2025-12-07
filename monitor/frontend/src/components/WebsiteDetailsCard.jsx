// src/components/WebsiteDetailsCard.jsx
import React, { useContext, useMemo } from "react";
import { ThemeContext } from "../context/ThemeContext";
import TimeRangeToggle from "./TimeRangeToggle";
import StatusChart from "./StatusChart";
import SSLCard from "./SSLCard";

export default function WebsiteDetailsCard({
  website,
  statuses,
  rangeHours = 3,
  onChangeRangeHours,
}) {
  const { darkMode } = useContext(ThemeContext);

  const safeStatuses = Array.isArray(statuses) ? statuses.filter(Boolean) : [];

  const latest = useMemo(() => {
    if (!safeStatuses.length) return null;
    return safeStatuses.reduce((a, b) =>
      (a?.checked_at ?? -Infinity) > (b?.checked_at ?? -Infinity) ? a : b
    );
  }, [safeStatuses]);

  const onlineWithMs = useMemo(() => {
    return safeStatuses.filter(
      (s) => s?.is_up && typeof s?.response_time_ms === "number"
    );
  }, [safeStatuses]);

  const fastest = useMemo(() => {
    if (!onlineWithMs.length) return null;
    return onlineWithMs.reduce((a, b) =>
      a.response_time_ms < b.response_time_ms ? a : b
    );
  }, [onlineWithMs]);

  const slowest = useMemo(() => {
    if (!onlineWithMs.length) return null;
    return onlineWithMs.reduce((a, b) =>
      a.response_time_ms > b.response_time_ms ? a : b
    );
  }, [onlineWithMs]);

  const isOnline = latest?.is_up;

  const cardCls = [
    "rounded-lg p-5 shadow-xl ring-1",
    darkMode ? "bg-gray-900/70 ring-black/5" : "bg-white ring-black/10",
  ].join(" ");

  const titleCls = darkMode
    ? "text-2xl font-semibold text-white"
    : "text-2xl font-semibold text-gray-900";
  const subtitleCls = darkMode
    ? "text-sm text-gray-400"
    : "text-sm text-gray-500";

  const statWrapCls = darkMode
    ? "bg-gray-800/70 rounded-lg p-4"
    : "bg-gray-50 rounded-lg p-4";

  const statLabelCls = darkMode
    ? "text-xs text-gray-400 mb-1"
    : "text-xs text-gray-500 mb-1";

  const statValueCls = darkMode
    ? "text-2xl font-semibold text-white"
    : "text-2xl font-semibold text-gray-900";

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className={titleCls}>{website?.name}</h2>
          <p className={subtitleCls}>{website?.url}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 text-sm ${
              isOnline ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {isOnline ? "Online" : "Offline"}
          </span>
          <TimeRangeToggle
            valueHours={rangeHours}
            onChange={onChangeRangeHours}
          />
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
        <div className={statWrapCls}>
          <div className={statLabelCls}>Latest</div>
          <div className={statValueCls}>
            {latest?.is_up && typeof latest?.response_time_ms === "number"
              ? `${latest.response_time_ms} ms`
              : "—"}
          </div>
        </div>

        <div className={statWrapCls}>
          <div className={statLabelCls}>Fastest</div>
          <div className={statValueCls}>
            {fastest ? `${fastest.response_time_ms} ms` : "—"}
          </div>
        </div>

        <div className={statWrapCls}>
          <div className={statLabelCls}>Slowest</div>
          <div className={statValueCls}>
            {slowest ? `${slowest.response_time_ms} ms` : "—"}
          </div>
        </div>
      </div>

      <div
        className={
          darkMode
            ? "text-white font-semibold mb-2"
            : "text-gray-900 font-semibold mb-2"
        }
      >
        Response Time History
      </div>
      <StatusChart statuses={safeStatuses} rangeHours={rangeHours} />
      <div className="mt-4">
        <SSLCard website={website} />
      </div>
    </div>
  );
}
