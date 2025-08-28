import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function DeleteConfirmModal({ open, onClose, onConfirm, website }) {
  const { darkMode } = useContext(ThemeContext);

  if (!open || !website) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal card */}
      <div
        className={`relative z-10 rounded-xl shadow-2xl max-w-md w-full p-6 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">Delete Website</h2>
        <p className="text-sm mb-6">
          Are you sure you want to remove{" "}
          <span className="font-semibold">{website.name}</span>? <br />
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(website)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
