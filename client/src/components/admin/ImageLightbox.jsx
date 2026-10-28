import React, { useEffect } from "react";
import { X, ExternalLink, Download, FileText, Image as ImageIcon } from "lucide-react";
import { useAdminTheme } from "../../context/AdminThemeContext";

export default function ImageLightbox({ media, onClose }) {
  const { isLight } = useAdminTheme();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!media || !media.url) return null;

  const isPdf = media.isPdf || media.url.toLowerCase().endsWith(".pdf") || media.type === "pdf";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`relative max-w-5xl w-full max-h-[94vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight
            ? "bg-white border-slate-300 text-slate-900"
            : "bg-zinc-950 border-white/15 text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div
          className={`p-4 sm:px-6 border-b flex items-center justify-between gap-4 ${
            isLight
              ? "bg-slate-50 border-slate-200"
              : "bg-zinc-900/80 border-white/10"
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {isPdf ? (
              <FileText className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-cyan-500 shrink-0" />
            )}
            <div>
              <h3
                className={`font-heading font-bold text-sm sm:text-base truncate ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {media.title || (isPdf ? "Abstract Proposal Document" : "Submitted College ID Card")}
              </h3>
              {media.subtitle && (
                <p
                  className={`text-[11px] font-mono truncate ${
                    isLight ? "text-slate-500" : "text-zinc-400"
                  }`}
                >
                  {media.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open Original in New Tab */}
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-mono ${
                isLight
                  ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm"
                  : "bg-white/[0.05] hover:bg-white/15 border-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open Original</span>
            </a>

            {/* Direct Download */}
            <a
              href={media.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors flex items-center gap-1.5 text-xs font-mono shadow-sm"
              title="Download file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ml-1 ${
                isLight
                  ? "bg-white hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900"
                  : "bg-white/[0.05] hover:bg-white/20 border-white/10 text-zinc-400 hover:text-white"
              }`}
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Display Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-zinc-950/90 min-h-[350px] max-h-[75vh]">
          {isPdf ? (
            <div className="w-full h-full flex flex-col items-center gap-4">
              <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-inner relative">
                <iframe
                  src={`${media.url}#toolbar=1`}
                  title={media.title || "PDF Document"}
                  className="w-full h-full border-0 rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div className="relative group max-w-full max-h-full flex items-center justify-center">
              <img
                src={media.url}
                alt={media.title || "Media Preview"}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/15"
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div
          className={`px-6 py-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
            isLight
              ? "bg-slate-50 border-slate-200 text-slate-600"
              : "bg-zinc-900/50 border-white/10 text-zinc-400"
          }`}
        >
          <span className="truncate max-w-md">{media.url}</span>
          <span className={isLight ? "text-slate-400" : "text-zinc-500"}>Cloudinary CDN</span>
        </div>
      </div>
    </div>
  );
}
