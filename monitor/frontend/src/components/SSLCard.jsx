import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";

export default function SSLCard({ website }) {
  const { darkMode } = useContext(ThemeContext);
  const [ssl, setSsl] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!website?.id) return;
    setError(null);
    axios
      .get(`${API_BASE_URL}/api/websites/${website.id}/ssl`)
      .then((res) => setSsl(res.data))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load SSL"));
  }, [website?.id]);

  const cardCls = [
    "rounded-xl p-4 shadow ring-1",
    darkMode ? "bg-gray-900/70 ring-black/5" : "bg-white ring-black/10",
  ].join(" ");

  const titleCls = darkMode ? "text-white font-semibold mb-2" : "text-gray-900 font-semibold mb-2";
  const label = (t) => (darkMode ? "text-xs text-gray-400" : "text-xs text-gray-500");

  let badgeText = "Unknown";
  let badgeCls =
    "inline-block px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  if (ssl?.error) {
    badgeText = "SSL Error";
    badgeCls = "inline-block px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400";
  } else if (typeof ssl?.days_left === "number") {
    if (ssl.days_left <= 3) {
      badgeText = `Expires in ${ssl.days_left}d`;
      badgeCls = "inline-block px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400";
    } else if (ssl.days_left <= 14) {
      badgeText = `Expires in ${ssl.days_left}d`;
      badgeCls = "inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
    } else {
      badgeText = `Valid (${ssl.days_left}d left)`;
      badgeCls = "inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    }
  }

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <div className={titleCls}>SSL Certificate</div>
        <span className={badgeCls}>{badgeText}</span>
      </div>

      {error && <div className="text-sm text-rose-500 mt-2">{error}</div>}

      {!error && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className={label()}>Host</div>
            <div className={darkMode ? "text-white" : "text-gray-900"}>{ssl?.host || "—"}</div>
          </div>
          <div>
            <div className={label()}>Issuer</div>
            <div className={darkMode ? "text-white" : "text-gray-900"}>{ssl?.issuer || "—"}</div>
          </div>
          <div>
            <div className={label()}>Valid Till</div>
            <div className={darkMode ? "text-white" : "text-gray-900"}>
              {ssl?.valid_to ? new Date(ssl.valid_to * 1000).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
