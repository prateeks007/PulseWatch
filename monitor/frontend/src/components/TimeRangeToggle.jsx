import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const OPTIONS = [
  { label: "30m", hours: 0.5 },
  { label: "3h", hours: 3 },
  { label: "24h", hours: 24 },
];

export default function TimeRangeToggle({ valueHours, onChange }) {
  const { darkMode } = useContext(ThemeContext);

  const wrapCls = [
    "inline-flex rounded-xl p-1 shadow-sm",
    darkMode ? "bg-gray-800/60" : "bg-gray-200/80"
  ].join(" ");

  return (
    <div className={wrapCls}>
      {OPTIONS.map((opt) => {
        const active = valueHours === opt.hours;
        const btnCls = [
          "px-3 py-1.5 rounded-lg text-sm transition",
          active
            ? darkMode
              ? "bg-gray-700 text-white shadow"
              : "bg-white text-gray-900 shadow"
            : darkMode
            ? "text-gray-300 hover:text-white hover:bg-gray-700/60"
            : "text-gray-700 hover:text-gray-900 hover:bg-white/70"
        ].join(" ");

        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.hours)}
            className={btnCls}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
