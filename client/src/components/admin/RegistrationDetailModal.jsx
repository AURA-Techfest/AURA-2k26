import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Shield,
  AlertTriangle,
  Cpu,
  Users,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Zap,
  DollarSign,
  Eye,
  IdCard,
  Maximize2,
  Image as ImageIcon,
} from "lucide-react";
import ImageLightbox from "./ImageLightbox";
import { getPdfPreviewUrl, extractIdCards } from "../../utils/cloudinary";
import { useAdminTheme } from "../../context/AdminThemeContext";

export default function RegistrationDetailModal({ registration, onClose }) {
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState("media"); // 'media', 'project', 'team', 'safety'
  const [activeLightbox, setActiveLightbox] = useState(null);

  const { isLight } = useAdminTheme();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !activeLightbox) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activeLightbox]);

  if (!registration) return null;

  const copyRegId = () => {
    if (registration.registrationId) {
      navigator.clipboard.writeText(registration.registrationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const idCards = extractIdCards(registration);
  const pdfPreviewUrl = registration.abstractPdf
    ? getPdfPreviewUrl(registration.abstractPdf)
    : "";

  const openCardLightbox = (card) => {
    setActiveLightbox({
      url: card.url,
      title: `${card.role} ID Card - ${registration.teamName}`,
      subtitle: `${card.name} (${registration.teamLeaderEmail})`,
      isPdf: false,
    });
  };

  const openPdfLightbox = () => {
    if (!registration.abstractPdf) return;
    setActiveLightbox({
      url: registration.abstractPdf,
      title: `${registration.projectTitle} - Abstract Proposal`,
      subtitle: `${registration.teamName} (${registration.abstractPdfOriginalName || "PDF Document"})`,
      isPdf: true,
      previewUrl: pdfPreviewUrl,
    });
  };

  const getStatusBadge = (status) => {
    if (status === "fully_working") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Fully Working
        </span>
      );
    }
    if (status === "minor_limitations") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Minor Limitations
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        No Prototype
      </span>
    );
  };

  const getAffiliationBadge = (affil) => {
    if (affil === "all_aliah") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold">
          All Aliah
        </span>
      );
    }
    if (affil === "all_other") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-semibold">
          External Institution
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
        Mixed Team
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
        <div
          className={`relative w-full max-w-5xl max-h-[94vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans transition-colors ${
            isLight
              ? "bg-white border-slate-300 text-slate-900"
              : "bg-zinc-950 border-white/10 text-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Top Header */}
          <div
            className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isLight
                ? "bg-slate-50/90 border-slate-200"
                : "bg-zinc-900/70 border-white/10"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-mono text-xs px-2.5 py-1 border rounded-md font-bold tracking-wider flex items-center gap-1.5 ${
                    isLight
                      ? "bg-amber-100 border-amber-300 text-amber-850"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {registration.registrationId || "PENDING-ID"}
                  <button
                    onClick={copyRegId}
                    title="Copy Registration ID"
                    className="hover:opacity-75 transition-opacity cursor-pointer"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
                {getStatusBadge(registration.hasWorkingPrototype)}
                {getAffiliationBadge(registration.teamAffiliation)}
              </div>
              <h2
                className={`text-xl sm:text-2xl font-bold tracking-wide font-heading ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {registration.teamName}
              </h2>
              <p
                className={`text-xs font-mono flex items-center gap-3 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span
                  className={`flex items-center gap-1.5 font-medium ${
                    isLight ? "text-slate-700" : "text-zinc-300"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  Leader: <strong>{registration.teamLeaderName}</strong> ({registration.teamLeaderPhone})
                </span>
                <span className="text-zinc-400">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {formatDate(registration.createdAt)}
                </span>
              </p>
            </div>

            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl border transition-colors self-end sm:self-auto cursor-pointer ${
                isLight
                  ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900 shadow-sm"
                  : "bg-white/[0.05] hover:bg-white/15 border-white/10 text-zinc-400 hover:text-white"
              }`}
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Navigation Tabs */}
          <div
            className={`flex border-b px-4 sm:px-6 gap-2 overflow-x-auto text-xs font-mono tracking-wider ${
              isLight
                ? "bg-slate-100/80 border-slate-200"
                : "bg-black/50 border-white/10"
            }`}
          >
            {[
              { id: "media", label: `Uploads & Cloudinary Media (${idCards.length + (registration.abstractPdf ? 1 : 0)})`, icon: ImageIcon },
              { id: "project", label: "Project & Tech", icon: Cpu },
              { id: "team", label: "Team & Contact", icon: Users },
              { id: "safety", label: "Safety & Compliance", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? isLight
                        ? "border-amber-500 text-amber-800 bg-white font-bold shadow-sm"
                        : "border-amber-400 text-amber-300 bg-white/[0.04]"
                      : isLight
                      ? "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Body / Scrollable Content */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm ${
              isLight ? "bg-slate-50/50" : "bg-gradient-to-b from-transparent to-black/30"
            }`}
          >
            {/* TAB 1: MEDIA & CLOUDINARY UPLOADS */}
            {activeTab === "media" && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. College ID Cards Gallery */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/50 border-white/10"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-3 ${
                      isLight ? "border-slate-200" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IdCard className="w-5 h-5 text-amber-500" />
                      <h3
                        className={`font-heading font-bold text-base ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        Submitted College ID Cards ({idCards.length})
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-mono ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Cloudinary CDN Hosted · Click to Enlarge
                    </span>
                  </div>

                  {idCards.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 font-mono text-xs italic">
                      No ID cards were uploaded for this team.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {idCards.map((card, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3.5 flex flex-col justify-between group transition-all shadow-md ${
                            isLight
                              ? "bg-slate-50 border-slate-200 hover:border-amber-500 hover:shadow-lg"
                              : "bg-black/60 border-white/10 hover:border-amber-500/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-mono font-bold ${
                                isLight ? "text-amber-700" : "text-amber-400"
                              }`}
                            >
                              {card.role}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                isLight
                                  ? "bg-slate-200/80 text-slate-700"
                                  : "bg-white/[0.05] text-zinc-300"
                              }`}
                            >
                              {card.name}
                            </span>
                          </div>

                          {/* Image Container with zoom click */}
                          <div
                            onClick={() => openCardLightbox(card)}
                            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-900 border border-slate-200 dark:border-white/10 mb-3 cursor-pointer group-hover:shadow-[0_0_15px_rgba(213,162,58,0.2)] transition-shadow"
                          >
                            <img
                              src={card.url}
                              alt={`${card.role} ID Card`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono">
                              <Maximize2 className="w-4 h-4 text-amber-400" />
                              <span>Click to Expand</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCardLightbox(card)}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-amber-500 hover:text-black border border-slate-300 text-slate-800 shadow-sm"
                                  : "bg-white/[0.05] hover:bg-amber-500 hover:text-black text-zinc-300"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect
                            </button>
                            <a
                              href={card.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isLight
                                  ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
                                  : "bg-white/[0.05] hover:bg-white/15 border-white/5 text-zinc-400 hover:text-white"
                              }`}
                              title="Open original Cloudinary URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Abstract Proposal PDF */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/50 border-white/10"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-3 ${
                      isLight ? "border-slate-200" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <h3
                        className={`font-heading font-bold text-base ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        Abstract Proposal Document & Live PDF Preview
                      </h3>
                    </div>
                    {registration.abstractPdf && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                      </span>
                    )}
                  </div>

                  {registration.abstractPdf ? (
                    <div className="space-y-4">
                      {/* Document Meta Row */}
                      <div
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                          isLight
                            ? "bg-slate-50 border-slate-200"
                            : "bg-black/40 border-white/5"
                        }`}
                      >
                        <div className="truncate max-w-lg">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isLight ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {registration.abstractPdfOriginalName || "Project_Abstract.pdf"}
                          </p>
                          <a
                            href={registration.abstractPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs font-mono truncate block mt-0.5 ${
                              isLight ? "text-amber-700 hover:underline" : "text-amber-400 hover:underline"
                            }`}
                          >
                            {registration.abstractPdf}
                          </a>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={openPdfLightbox}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            Full Reader
                          </button>
                          <a
                            href={registration.abstractPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
                              isLight
                                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm"
                                : "bg-white/[0.08] hover:bg-white/15 border-transparent text-white"
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            New Tab
                          </a>
                        </div>
                      </div>

                      {/* Visual Previews */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Column 1: Page 1 Image Preview */}
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                            isLight
                              ? "bg-slate-50 border-slate-200"
                              : "bg-black/50 border-white/10"
                          }`}
                        >
                          <div>
                            <span
                              className={`text-xs font-mono uppercase font-bold block mb-2 flex items-center gap-1.5 ${
                                isLight ? "text-amber-700" : "text-amber-400"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Page 1 Cover Image
                            </span>
                            <div
                              onClick={openPdfLightbox}
                              className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 border border-slate-300 dark:border-white/10 cursor-pointer group"
                            >
                              <img
                                src={pdfPreviewUrl}
                                alt="Abstract Page 1"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono">
                                <Maximize2 className="w-4 h-4 text-amber-400" />
                                <span>Click to Read</span>
                              </div>
                            </div>
                          </div>
                          <p
                            className={`text-[10px] font-mono mt-2 text-center ${
                              isLight ? "text-slate-500" : "text-zinc-500"
                            }`}
                          >
                            Rendered via Cloudinary PDF Image Pipeline
                          </p>
                        </div>

                        {/* Column 2: Live Embedded PDF Viewer */}
                        <div
                          className={`lg:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${
                            isLight
                              ? "bg-slate-50 border-slate-200"
                              : "bg-black/50 border-white/10"
                          }`}
                        >
                          <span
                            className={`text-xs font-mono uppercase font-bold block mb-2 flex items-center gap-1.5 ${
                              isLight ? "text-cyan-700" : "text-cyan-400"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" /> Embedded PDF Viewer
                          </span>
                          <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 bg-zinc-900">
                            <iframe
                              src={`${registration.abstractPdf}#toolbar=0`}
                              title="Abstract Document Live Preview"
                              className="w-full h-full border-0"
                            />
                          </div>
                          <div
                            className={`mt-2 flex items-center justify-between text-[10px] font-mono ${
                              isLight ? "text-slate-600" : "text-zinc-400"
                            }`}
                          >
                            <span>Interactive PDF Frame</span>
                            <button
                              onClick={openPdfLightbox}
                              className={`cursor-pointer ${
                                isLight
                                  ? "text-amber-700 hover:underline font-bold"
                                  : "text-amber-400 hover:underline"
                              }`}
                            >
                              Open in Fullscreen Reader ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-400 font-mono text-xs italic">
                      No abstract PDF attached to this registration.
                    </div>
                  )}
                </div>

                {/* 3. Payment Screenshot (if paid) */}
                {registration.paymentScreenshot && (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isLight
                        ? "bg-white border-slate-200 shadow-sm"
                        : "bg-zinc-900/50 border-white/10"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-3 ${
                        isLight ? "border-slate-200" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        <h3
                          className={`font-heading font-bold text-base ${
                            isLight ? "text-slate-900" : "text-white"
                          }`}
                        >
                          Payment Proof & Transaction Receipt
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{registration.registrationFee || 0}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div
                        onClick={() =>
                          setActiveLightbox({
                            url: registration.paymentScreenshot,
                            title: `Payment Receipt - ${registration.teamName}`,
                            subtitle: `Txn ID: ${registration.transactionId || "N/A"}`,
                          })
                        }
                        className="w-48 aspect-[4/3] rounded-xl overflow-hidden bg-black/60 border border-slate-300 dark:border-white/10 cursor-pointer hover:border-emerald-500 transition-colors shrink-0 group relative shadow-md"
                      >
                        <img
                          src={registration.paymentScreenshot}
                          alt="Payment Receipt"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-mono text-emerald-300">
                          <Maximize2 className="w-4 h-4 mr-1" /> Inspect
                        </div>
                      </div>

                      <div
                        className={`space-y-1 text-xs font-mono ${
                          isLight ? "text-slate-700" : "text-zinc-300"
                        }`}
                      >
                        <p>Transaction ID: <strong className={isLight ? "text-slate-900" : "text-white"}>{registration.transactionId || "N/A"}</strong></p>
                        <p>Fee Status: <strong className={`capitalize ${isLight ? "text-slate-900" : "text-white"}`}>{registration.registrationFeeStatus}</strong></p>
                        <a
                          href={registration.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 mt-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Original Receipt
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROJECT & TECH */}
            {activeTab === "project" && (
              <div className="space-y-6 animate-fade-in">
                {/* Project Title Banner */}
                <div
                  className={`p-4 rounded-xl border ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <span
                    className={`text-[11px] font-mono tracking-widest uppercase font-bold ${
                      isLight ? "text-amber-700" : "text-amber-400"
                    }`}
                  >
                    Project Title
                  </span>
                  <h3
                    className={`text-lg font-bold mt-1 ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {registration.projectTitle}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Type: {registration.prototypeType}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Status: {registration.currentWorkingStatus}
                    </span>
                    {registration.useAi && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3 h-3" /> AI Enabled
                      </span>
                    )}
                    {registration.useIot && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                        <Zap className="w-3 h-3" /> IoT Enabled
                      </span>
                    )}
                  </div>
                </div>

                {/* Hardware Categories */}
                <div>
                  <h4
                    className={`text-xs font-mono tracking-widest uppercase font-semibold mb-2 ${
                      isLight ? "text-slate-600" : "text-zinc-400"
                    }`}
                  >
                    Project Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {registration.hardwareProjectCategories?.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-lg text-xs font-mono border ${
                          isLight
                            ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                            : "bg-zinc-900 border-zinc-700 text-zinc-300"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem & Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl border space-y-1 ${
                      isLight
                        ? "bg-white border-slate-200 shadow-sm"
                        : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-xs font-mono uppercase font-semibold ${
                        isLight ? "text-amber-700" : "text-amber-400"
                      }`}
                    >
                      Problem Statement
                    </span>
                    <p
                      className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                        isLight ? "text-slate-700" : "text-zinc-300"
                      }`}
                    >
                      {registration.problemStatement}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border space-y-1 ${
                      isLight
                        ? "bg-white border-slate-200 shadow-sm"
                        : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-xs font-mono uppercase font-semibold ${
                        isLight ? "text-amber-700" : "text-amber-400"
                      }`}
                    >
                      Proposed Solution
                    </span>
                    <p
                      className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                        isLight ? "text-slate-700" : "text-zinc-300"
                      }`}
                    >
                      {registration.solutionDescription}
                    </p>
                  </div>
                </div>

                {/* Innovation Description */}
                <div
                  className={`p-4 rounded-xl border space-y-1 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold ${
                      isLight ? "text-amber-700" : "text-amber-400"
                    }`}
                  >
                    Innovation & Uniqueness
                  </span>
                  <p
                    className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                      isLight ? "text-slate-700" : "text-zinc-300"
                    }`}
                  >
                    {registration.innovationDescription}
                  </p>
                </div>

                {/* Working Principle */}
                <div
                  className={`p-4 rounded-xl border space-y-1 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold ${
                      isLight ? "text-cyan-700" : "text-cyan-400"
                    }`}
                  >
                    Working Principle & Architecture
                  </span>
                  <p
                    className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                      isLight ? "text-slate-700" : "text-zinc-300"
                    }`}
                  >
                    {registration.workingPrinciple}
                  </p>
                </div>

                {/* Major Hardware Components */}
                <div>
                  <h4
                    className={`text-xs font-mono tracking-widest uppercase font-semibold mb-2 ${
                      isLight ? "text-slate-600" : "text-zinc-400"
                    }`}
                  >
                    Major Hardware Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {registration.majorHardwareComponents?.map((comp, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                          isLight
                            ? "bg-slate-100 border-slate-300 text-slate-800"
                            : "bg-white/[0.04] border-white/10 text-amber-300/90"
                        }`}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Highlights & Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono uppercase block ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Power Source
                    </span>
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {registration.powerSource?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono uppercase block ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Development Cost
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{Number(registration.prototypeDevelopmentCost || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono uppercase block ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Commercial Potential
                    </span>
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {registration.productPotential}
                    </span>
                  </div>
                </div>

                {/* AURA Live Demo Highlight */}
                <div
                  className={`p-4 rounded-xl border space-y-1 ${
                    isLight
                      ? "bg-amber-50/60 border-amber-200 text-slate-800"
                      : "bg-amber-500/5 border-amber-500/20 text-zinc-300"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold flex items-center gap-1.5 ${
                      isLight ? "text-amber-800" : "text-amber-400"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Live Exhibition Demo Highlight
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {registration.auraDemoHighlight}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TEAM & CONTACT */}
            {activeTab === "team" && (
              <div className="space-y-6 animate-fade-in">
                {/* Leader Info Card */}
                <div
                  className={`p-5 rounded-xl border space-y-4 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-3 ${
                      isLight ? "border-slate-200" : "border-white/10"
                    }`}
                  >
                    <div>
                      <span
                        className={`text-[11px] font-mono uppercase font-bold ${
                          isLight ? "text-amber-700" : "text-amber-400"
                        }`}
                      >
                        Team Leader
                      </span>
                      <h3
                        className={`text-lg font-bold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {registration.teamLeaderName}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono border ${
                        isLight
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      Team Size: {registration.teamSize} Members
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div
                      className={`flex items-center gap-2 ${
                        isLight ? "text-slate-700" : "text-zinc-300"
                      }`}
                    >
                      <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                      <a
                        href={`mailto:${registration.teamLeaderEmail}`}
                        className="hover:underline font-medium"
                      >
                        {registration.teamLeaderEmail}
                      </a>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        isLight ? "text-slate-700" : "text-zinc-300"
                      }`}
                    >
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <a
                        href={`tel:${registration.teamLeaderPhone}`}
                        className="hover:underline font-medium"
                      >
                        {registration.teamLeaderPhone}
                      </a>
                    </div>
                  </div>

                  <div
                    className={`pt-2 flex items-center gap-4 text-xs font-mono ${
                      isLight ? "text-slate-600" : "text-zinc-400"
                    }`}
                  >
                    <span>Aliah Members: <strong className={isLight ? "text-slate-900" : "text-white"}>{registration.aliahMembers ?? 0}</strong></span>
                    <span>External Members: <strong className={isLight ? "text-slate-900" : "text-white"}>{registration.otherInstitutionMembers ?? 0}</strong></span>
                  </div>
                </div>

                {/* Team Member Details Text */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold ${
                      isLight ? "text-amber-700" : "text-amber-400"
                    }`}
                  >
                    Member Details & Credentials
                  </span>
                  <div
                    className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed border ${
                      isLight
                        ? "bg-slate-50 text-slate-800 border-slate-200"
                        : "bg-black/40 text-zinc-300 border-white/5"
                    }`}
                  >
                    {registration.teamMemberDetails}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAFETY & COMPLIANCE */}
            {activeTab === "safety" && (
              <div className="space-y-6 animate-fade-in">
                {/* Hazards Identified */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold flex items-center gap-2 ${
                      isLight ? "text-amber-700" : "text-amber-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Identified Safety Hazards
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {registration.safetyHazards?.map((hazard, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-mono bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-semibold"
                      >
                        {hazard.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Safety Precautions Taken */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight
                      ? "bg-white border-slate-200 shadow-sm"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`text-xs font-mono uppercase font-semibold flex items-center gap-2 ${
                      isLight ? "text-emerald-700" : "text-emerald-400"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Safety Precautions & Mitigation Protocols
                  </span>
                  <p
                    className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                      isLight ? "text-slate-700" : "text-zinc-300"
                    }`}
                  >
                    {registration.safetyPrecautions}
                  </p>
                </div>

                {/* Supervision and Team Authorship */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl border ${
                      isLight ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono uppercase block ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Continuous Supervision Required
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {registration.requiresContinuousSupervision ? "Yes (High Attention)" : "No"}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isLight ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono uppercase block ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      Developed By Team
                    </span>
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {registration.prototypeDevelopedByTeam?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Email Delivery Audit */}
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
                    isLight
                      ? "bg-white border-slate-200"
                      : "bg-zinc-900/40 border-white/5"
                  }`}
                >
                  <span
                    className={`uppercase font-semibold flex items-center gap-2 ${
                      isLight ? "text-purple-700" : "text-purple-400"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Automated Email Confirmation Audit
                  </span>
                  <div
                    className={`p-3 rounded-lg space-y-1 ${
                      isLight ? "bg-slate-50 text-slate-700" : "bg-black/40 text-zinc-300"
                    }`}
                  >
                    <div>Status: <strong className="capitalize">{registration.emailStatus}</strong></div>
                    {registration.emailSentAt && <div>Sent At: <span>{formatDate(registration.emailSentAt)}</span></div>}
                    {registration.emailMessageId && <div>Message ID: <span className="break-all">{registration.emailMessageId}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className={`p-4 border-t flex items-center justify-between ${
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-500"
                : "bg-zinc-900/40 border-white/10 text-zinc-500"
            }`}
          >
            <span className="text-xs font-mono">
              AURA 2K26 Registration Registry · {registration.teamLeaderEmail}
            </span>
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                isLight
                  ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  : "bg-white/[0.08] hover:bg-white/15 text-zinc-300 hover:text-white"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Lightbox Overlay */}
      {activeLightbox && (
        <ImageLightbox
          media={activeLightbox}
          onClose={() => setActiveLightbox(null)}
        />
      )}
    </>
  );
}
