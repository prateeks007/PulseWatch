import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { MoreVertical } from "lucide-react";
import StatusIndicator, { StatusDot } from "./StatusIndicator";
import UptimeBadge from "./UptimeBadge";
import MiniChart from "./MiniChart";

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
  } catch {
    return `https://www.google.com/s2/favicons?sz=64&domain=${url}`;
  }
}

export default function WebsiteList({ websites, selectedWebsite, onSelect, onDelete, totalCount, statusesByWebsite = {} }) {
  const { darkMode } = useContext(ThemeContext);
  const [menuOpen, setMenuOpen] = useState(null);
  
  const showingCount = websites?.length || 0;
  const total = totalCount || showingCount;

  const containerCls = [
    "rounded-lg p-4 shadow-xl ring-1",
    darkMode ? "bg-gray-900/70 ring-black/5" : "bg-white ring-black/10",
  ].join(" ");

  const baseRow =
    "relative w-full text-left px-3 py-3 rounded-lg transition flex items-center gap-3 group";

  return (
    <div className={containerCls}>
      <div
        className={
          darkMode ? "text-white font-semibold mb-3" : "text-gray-900 font-semibold mb-3"
        }
      >
        Monitored Websites  
        {showingCount !== total ? (
          <span className="text-sm font-normal text-gray-400">({showingCount} of {total})</span>
        ) : (
          <span className="text-sm font-normal text-gray-400">({total})</span>
        )}
      </div>

      {(!websites || websites.length === 0) && (
        <div className="text-center py-10 text-sm text-gray-400">
          <div className="mb-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="font-medium">No websites found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      <div className="space-y-2">
        {websites?.map((w) => {
          const active = selectedWebsite?.id === w.id;
          const last = w?.lastStatus;

          const statusColor =
            last === true
              ? "border-l-4 border-emerald-500"
              : last === false
              ? "border-l-4 border-rose-500"
              : "border-l-4 border-amber-500";

          const statusValue = last === true ? 'online' : last === false ? 'offline' : 'unknown';

          const rowCls = [
            baseRow,
            active
              ? darkMode
                ? "bg-gray-800 ring-1 ring-blue-500/40"
                : "bg-gray-100 ring-1 ring-blue-500/20"
              : darkMode
              ? "bg-gray-800/50 hover:bg-gray-700/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              : "bg-gray-50 hover:bg-gray-100 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]",
            statusColor,
            "transition-all duration-200 ease-out",
          ].join(" ");

          return (
            <div key={w.id ?? w.url} className="relative">
              <button
                onClick={() => onSelect?.(w)}
                className={rowCls}
                title={w.url}
              >
                <img
                  src={getFavicon(w.url)}
                  alt=""
                  className="h-5 w-5 rounded-sm"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 pr-8"> {/* Add right padding to avoid menu overlap */}
                  <div className="mb-1">
                    <div
                      className={
                        darkMode
                          ? "text-white/90 font-medium truncate"
                          : "text-gray-900 font-medium truncate"
                      }
                    >
                      {w.name}
                    </div>
                  </div>
                  <div
                    className={
                      darkMode
                        ? "text-xs text-gray-400 truncate mb-2"
                        : "text-xs text-gray-500 truncate mb-2"
                    }
                  >
                    {w.url}
                  </div>
                  <div className="flex items-center justify-between">
                    <UptimeBadge percentage={w.uptimePercentage || 0} size="xs" />
                    <MiniChart 
                      data={statusesByWebsite[w.id] || []} 
                      height={32} 
                      width={100} 
                    />
                  </div>
                </div>
              </button>

              {/* menu button */}
              <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === w.id ? null : w.id);
                }}
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>

              {/* dropdown */}
              {menuOpen === w.id && (
                <div
                  className={`absolute right-2 top-10 w-40 rounded-lg shadow-lg border z-10 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-500 hover:text-white rounded-t-lg"
                    onClick={() => {
                      setMenuOpen(null);
                      onDelete?.(w);
                    }}
                  >
                    Delete Website
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
