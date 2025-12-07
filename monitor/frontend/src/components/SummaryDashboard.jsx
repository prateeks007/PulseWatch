import React, { useContext, useMemo, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Globe, CheckCircle, Clock, Zap, Shield, TrendingUp, Activity } from "lucide-react";
import StatusIndicator from "./StatusIndicator";
import axios from "axios";

function SummaryDashboard({
  websites,
  statuses,
  statusesByWebsite = {},
  rangeHours = 3,
}) {

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const { darkMode } = useContext(ThemeContext);
  const { getToken } = useAuth();
  const [sslSummary, setSslSummary] = useState(null);

  useEffect(() => {
    const fetchSSLSummary = async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/ssl/summary`, { headers });
        setSslSummary(res.data);
      } catch (error) {
        setSslSummary(null);
      }
    };
    fetchSSLSummary();
  }, [websites, getToken]);

  const totalWebsites = websites.length;
  const onlineWebsites = websites.filter((w) => w.lastStatus === true).length;
  const offlineWebsites = websites.filter((w) => w.lastStatus === false).length;
  const unknownWebsites = websites.filter(
    (w) => w.lastStatus !== true && w.lastStatus !== false
  ).length; // ✅ FIX: use .length

  const latestStatusesMap = useMemo(() => {
    const map = new Map();
    (statuses || []).forEach((status) => {
      const prev = map.get(status.website_id);
      if (!prev || status.checked_at > prev.checked_at) {
        map.set(status.website_id, status);
      }
    });
    return map;
  }, [statuses]);

  const cutoff = useMemo(
    () => Date.now() - rangeHours * 60 * 60 * 1000,
    [rangeHours]
  );

  const {
    avgResponseTime,
    slowestWebsiteName,
    slowestResponseTime,
  } = useMemo(() => {
    let totalMs = 0;
    let count = 0;
    let slowestMs = 0;
    let slowestName = null;

    websites.forEach((w) => {
      const arr = Array.isArray(statusesByWebsite[w.id])
        ? statusesByWebsite[w.id]
        : [];

      const inWindow = arr.filter(
        (s) =>
          typeof s?.checked_at === "number" &&
          s.checked_at * 1000 >= cutoff &&
          s?.is_up &&
          typeof s?.response_time_ms === "number"
      );

      if (inWindow.length > 0) {
        const latestInWindow = inWindow.reduce((a, b) =>
          a.checked_at > b.checked_at ? a : b
        );
        totalMs += latestInWindow.response_time_ms;
        count += 1;

        const localSlowest = inWindow.reduce((a, b) =>
          a.response_time_ms > b.response_time_ms ? a : b
        );
        if (localSlowest.response_time_ms > slowestMs) {
          slowestMs = localSlowest.response_time_ms;
          slowestName = w.name; // store string only
        }
      } else {
        const latest = latestStatusesMap.get(w.id);
        if (latest?.is_up && typeof latest?.response_time_ms === "number") {
          totalMs += latest.response_time_ms;
          count += 1;

          if (latest.response_time_ms > slowestMs) {
            slowestMs = latest.response_time_ms;
            slowestName = w.name; // store string only
          }
        }
      }
    });

    return {
      avgResponseTime: count > 0 ? Math.round(totalMs / count) : 0,
      slowestWebsiteName: slowestName,
      slowestResponseTime: slowestMs,
    };
  }, [websites, statusesByWebsite, latestStatusesMap, cutoff]);

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Overview
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Real-time monitoring dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'} animate-pulse`} />
          <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Websites */}
        <div className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Total Websites
              </p>
              <div className={`p-2 rounded-lg ${
                darkMode ? "bg-blue-500/10" : "bg-blue-50"
              }`}>
                <Globe className={`h-5 w-5 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`} />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <p className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>{totalWebsites}</p>
              <span className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>sites</span>
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
        </div>

        {/* Online Status */}
        <div className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Online
              </p>
              <StatusIndicator status="online" size="md" />
            </div>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-2xl font-bold text-green-500">{onlineWebsites}</p>
              <span className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>of {totalWebsites}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1">
                <StatusIndicator status="offline" size="xs" />
                <span className={darkMode ? "text-red-400" : "text-red-500"}>Offline: {offlineWebsites}</span>
              </span>
              <span className="flex items-center space-x-1">
                <StatusIndicator status="unknown" size="xs" />
                <span className={darkMode ? "text-yellow-400" : "text-yellow-500"}>Unknown: {unknownWebsites}</span>
              </span>
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
        </div>

        {/* Average Response Time */}
        <div className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Avg Response Time
              </p>
              <div className={`p-2 rounded-lg ${
                darkMode ? "bg-purple-500/10" : "bg-purple-50"
              }`}>
                <Clock className={`h-5 w-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`} />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <p className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>{avgResponseTime}</p>
              <span className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>ms</span>
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
        </div>

        {/* Slowest Website */}
        <div className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Slowest Website
              </p>
              <div className={`p-2 rounded-lg ${
                darkMode ? "bg-yellow-500/10" : "bg-yellow-50"
              }`}>
                <TrendingUp className={`h-5 w-5 ${
                  darkMode ? "text-yellow-400" : "text-yellow-600"
                }`} />
              </div>
            </div>
            <div className="mb-2">
              <p className={`text-lg font-bold truncate ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                {slowestWebsiteName || "N/A"}
              </p>
            </div>
            <div className="text-sm">
              <span className={`font-medium ${
                darkMode ? "text-yellow-400" : "text-yellow-600"
              }`}>
                {slowestResponseTime > 0 ? `${slowestResponseTime} ms` : "No data"}
              </span>
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
        </div>

        {/* SSL Summary */}
        <div className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Earliest SSL Expiry
              </p>
              <div className={`p-2 rounded-lg ${
                darkMode ? "bg-indigo-500/10" : "bg-indigo-50"
              }`}>
                <Shield className={`h-5 w-5 ${
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                }`} />
              </div>
            </div>
            <div className="mb-2">
              <p className={`text-lg font-bold truncate ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                {sslSummary?.name || "N/A"}
              </p>
            </div>
            <div className="text-sm">
              {sslSummary?.days_left !== undefined ? (
                <span className={`font-medium ${
                  sslSummary.days_left <= 7
                    ? "text-red-500"
                    : sslSummary.days_left <= 30
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}>
                  {sslSummary.days_left} days left
                </span>
              ) : (
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>No data</span>
              )}
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
        </div>
      </div>
    </div>
  );
}

export default SummaryDashboard;
