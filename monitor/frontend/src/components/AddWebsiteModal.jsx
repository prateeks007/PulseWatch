import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { X } from "lucide-react";

export default function AddWebsiteModal({ open, onClose, onSubmit }) {
  const { darkMode } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = "Website name is required";
    } else if (name.trim().length > 100) {
      newErrors.name = "Website name must be less than 100 characters";
    }
    
    // Validate URL
    if (!url.trim()) {
      newErrors.url = "Website URL is required";
    } else {
      try {
        const urlObj = new URL(url.trim());
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          newErrors.url = "URL must start with http:// or https://";
        }
      } catch {
        newErrors.url = "Please enter a valid URL";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await onSubmit({ name: name.trim(), url: url.trim() });
      setName("");
      setUrl("");
      onClose();
    } catch (error) {
      // Handle backend validation errors
      if (error.response?.data?.validation_errors) {
        const backendErrors = {};
        error.response.data.validation_errors.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error.response?.data?.error || "Failed to add website. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`ml-auto w-full max-w-md h-full shadow-2xl transform transition-transform duration-300 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Add New Website</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1">Website Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              placeholder="e.g. My Portfolio"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                errors.name 
                  ? "border-red-500 focus:ring-red-500" 
                  : darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
              } focus:ring-2 focus:border-transparent`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url) setErrors(prev => ({ ...prev, url: null }));
              }}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                errors.url 
                  ? "border-red-500 focus:ring-red-500" 
                  : darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
              } focus:ring-2 focus:border-transparent`}
            />
            {errors.url && (
              <p className="text-red-500 text-xs mt-1">{errors.url}</p>
            )}
          </div>

          {errors.general && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700"
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Website"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
