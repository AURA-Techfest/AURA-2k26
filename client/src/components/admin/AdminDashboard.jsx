import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  Cpu,
  Search,
  RefreshCw,
  LogOut,
  ExternalLink,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  X,
  FileText,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
  Maximize2,
  Sun,
  Moon,
} from "lucide-react";

import {
  fetchRegistrations,
  fetchAdminStats,
  downloadRegistrationsCsv,
  clearAdminSession,
  getStoredAdmin,
} from "../../services/adminService";
import { useAdminTheme } from "../../context/AdminThemeContext";
import RegistrationDetailModal from "./RegistrationDetailModal";
import ImageLightbox from "./ImageLightbox";
import { getPdfPreviewUrl, extractIdCards } from "../../utils/cloudinary";
import auraLogo from "../../assets/AURA_26_LOGO.png";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = getStoredAdmin();
  const { theme, toggleTheme, isLight } = useAdminTheme();

  // State
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [affiliationFilter, setAffiliationFilter] = useState("all");
  const [prototypeStatusFilter, setPrototypeStatusFilter] = useState("all");
  const [emailStatusFilter, setEmailStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Pagination (10 per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selected registration for modal
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  // Active Lightbox image
  const [activeLightbox, setActiveLightbox] = useState(null);

  // Load data
  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [regsData, statsData] = await Promise.all([
        fetchRegistrations({
          sortBy,
          sortOrder,
        }),
        fetchAdminStats(),
      ]);

      setRegistrations(regsData.registrations || []);
      setStats(statsData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load registrations data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortBy, sortOrder]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const handleExportCsv = async () => {
    try {
      await downloadRegistrationsCsv();
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  const openLightboxForCard = (card, reg, e) => {
    if (e) e.stopPropagation();
    setActiveLightbox({
      url: card.url,
      title: `${card.role} ID Card - ${reg.teamName}`,
      subtitle: `${card.name} (${reg.teamLeaderEmail})`,
      isPdf: false,
    });
  };

  const openLightboxForPdf = (reg, e) => {
    if (e) e.stopPropagation();
    if (!reg.abstractPdf) return;
    setActiveLightbox({
      url: reg.abstractPdf,
      title: `${reg.projectTitle} - Abstract Proposal`,
      subtitle: `${reg.teamName} (${reg.abstractPdfOriginalName || "PDF Document"})`,
      isPdf: true,
      previewUrl: getPdfPreviewUrl(reg.abstractPdf),
    });
  };

  // Client-side filtering for snappy search & faceted filtering
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = reg.teamName?.toLowerCase().includes(q);
        const matchesLeader = reg.teamLeaderName?.toLowerCase().includes(q);
        const matchesEmail = reg.teamLeaderEmail?.toLowerCase().includes(q);
        const matchesPhone = reg.teamLeaderPhone?.toLowerCase().includes(q);
        const matchesId = reg.registrationId?.toLowerCase().includes(q);
        const matchesProject = reg.projectTitle?.toLowerCase().includes(q);
        const matchesMembers = reg.teamMemberDetails?.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesLeader &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesId &&
          !matchesProject &&
          !matchesMembers
        ) {
          return false;
        }
      }

      // 2. Affiliation Filter
      if (affiliationFilter !== "all" && reg.teamAffiliation !== affiliationFilter) {
        return false;
      }

      // 3. Prototype Status
      if (
        prototypeStatusFilter !== "all" &&
        reg.hasWorkingPrototype !== prototypeStatusFilter
      ) {
        return false;
      }

      // 4. Email Status
      if (emailStatusFilter !== "all" && reg.emailStatus !== emailStatusFilter) {
        return false;
      }

      // 5. Hardware Category
      if (categoryFilter !== "all") {
        if (
          !Array.isArray(reg.hardwareProjectCategories) ||
          !reg.hardwareProjectCategories.includes(categoryFilter)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    registrations,
    search,
    affiliationFilter,
    prototypeStatusFilter,
    emailStatusFilter,
    categoryFilter,
  ]);

  const hasActiveFilters =
    search.trim() ||
    affiliationFilter !== "all" ||
    prototypeStatusFilter !== "all" ||
    emailStatusFilter !== "all" ||
    categoryFilter !== "all";

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    affiliationFilter,
    prototypeStatusFilter,
    emailStatusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    pageSize,
  ]);

  const totalPages = Math.ceil(filteredRegistrations.length / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRegistrations = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, validCurrentPage, pageSize]);

  const startRecord =
    filteredRegistrations.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(
    validCurrentPage * pageSize,
    filteredRegistrations.length
  );

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      validCurrentPage - 1,
      validCurrentPage,
      validCurrentPage + 1,
      "...",
      totalPages,
    ];
  }, [totalPages, validCurrentPage]);

  const resetFilters = () => {
    setSearch("");
    setAffiliationFilter("all");
    setPrototypeStatusFilter("all");
    setEmailStatusFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
  };


  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none relative transition-colors duration-200 ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-[#0b0909] text-white"
      }`}
    >
      {/* Background High-Tech Grid */}
      {isLight ? (
        <div className="absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.08)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none z-0" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none z-0" />
      )}

      {/* TOP NAVIGATION BAR */}
      <header
        className={`relative z-10 border-b sticky top-0 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isLight
            ? "border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm"
            : "border-white/10 bg-zinc-950/80 backdrop-blur-xl"
        }`}
      >
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={auraLogo}
              alt="AURA 2K26"
              className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(213,162,58,0.3)] transition-transform group-hover:scale-105"
            />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-heading text-lg font-bold tracking-wider ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  AURA 2K26
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-widest font-bold border ${
                    isLight
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  ADMIN CONSOLE
                </span>
              </div>
              <p
                className={`text-[10px] font-mono tracking-wider ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                Exhibition Registrations Management
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* THEME TOGGLE BUTTON */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm"
                : "bg-white/[0.05] hover:bg-white/10 border-white/10 text-zinc-300"
            }`}
            title={`Switch to ${isLight ? "Dark" : "Light"} Theme`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold">Dark Theme</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Light Theme</span>
              </>
            )}
          </button>

          {/* User Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${
              isLight
                ? "bg-slate-100 border-slate-300 text-slate-700"
                : "bg-white/[0.04] border-white/10 text-zinc-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Admin:{" "}
              <strong className={isLight ? "text-slate-900" : "text-white"}>
                {adminUser?.userId || "admin"}
              </strong>
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Refresh database"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm"
                : "bg-white/[0.05] hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? "animate-spin text-amber-500"
                  : isLight
                  ? "text-slate-600"
                  : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Main Website Link */}
          <Link
            to="/"
            target="_blank"
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
                : "bg-white/[0.05] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="View Live Website"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log out from admin"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400 hover:text-red-300"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4 text-red-600 dark:text-red-300 text-sm font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-xs uppercase cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* METRICS & EXECUTIVE OVERVIEW CARDS */}
        {stats && (
          <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Total Registrations */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md"
                  : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-amber-500/40"
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-mono tracking-widest uppercase">
                  Total Teams
                </span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div
                className={`text-2xl sm:text-3xl font-bold font-heading ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {stats.totalRegistrations}
              </div>
              <p
                className={`text-[10px] font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}
              >
                Teams Registered
              </p>
            </div>

            {/* Card 2: Total Participants */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:border-cyan-400 hover:shadow-md"
                  : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-cyan-500/40"
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-mono tracking-widest uppercase">
                  Participants
                </span>
                <Users className="w-4 h-4 text-cyan-500" />
              </div>
              <div
                className={`text-2xl sm:text-3xl font-bold font-heading ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {stats.totalParticipants}
              </div>
              <p
                className={`text-[10px] font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}
              >
                Avg {(stats.totalParticipants / (stats.totalRegistrations || 1)).toFixed(1)} / team
              </p>
            </div>

            {/* Card 3: Working Prototypes */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:border-emerald-400 hover:shadow-md"
                  : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-emerald-500/40"
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-mono tracking-widest uppercase">
                  Working Hardware
                </span>
                <Cpu className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                {stats.readiness?.fullyWorking || 0}
              </div>
              <p
                className={`text-[10px] font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}
              >
                + {stats.readiness?.minorLimitations || 0} Minor Limitations
              </p>
            </div>

            {/* Card 4: Aliah vs External */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:border-purple-400 hover:shadow-md"
                  : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-purple-500/40"
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-mono tracking-widest uppercase">
                  Affiliation
                </span>
                <Building2 className="w-4 h-4 text-purple-500" />
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold font-heading flex items-baseline gap-1 ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                <span className="text-cyan-600 dark:text-cyan-300 font-bold">
                  {stats.affiliation?.allAliah || 0}
                </span>
                <span className="text-xs text-zinc-400">/</span>
                <span className="text-purple-600 dark:text-purple-300 font-bold">
                  {stats.affiliation?.allOther || 0}
                </span>
                <span className="text-xs text-zinc-400">/</span>
                <span className="text-amber-600 dark:text-amber-300 font-bold">
                  {stats.affiliation?.mixed || 0}
                </span>
              </div>
              <p
                className={`text-[10px] font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}
              >
                Aliah / External / Mixed
              </p>
            </div>

            {/* Card 5: Email Dispatched */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all col-span-2 lg:col-span-1 ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-md"
                  : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-blue-500/40"
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-mono tracking-widest uppercase">
                  Emails Delivered
                </span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-heading text-blue-600 dark:text-blue-400">
                {stats.emails?.sent || 0}
              </div>
              <p
                className={`text-[10px] font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}
              >
                {stats.emails?.pending || 0} Pending · {stats.emails?.failed || 0} Failed
              </p>
            </div>
          </section>
        )}

        {/* CONTROLS TOOLBAR & FILTERS */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-colors ${
            isLight
              ? "bg-white border-slate-200/90 shadow-sm text-slate-900"
              : "bg-zinc-950/70 border-white/10 backdrop-blur-md text-white"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team name, leader, email, phone, project title, or ID..."
                className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-xs sm:text-sm font-mono transition-all focus:outline-none focus:ring-1 ${
                  isLight
                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-amber-500/30"
                    : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/40"
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div
              className={`flex items-center gap-1 p-1 border rounded-xl shrink-0 self-start sm:self-auto ${
                isLight
                  ? "bg-slate-100 border-slate-300"
                  : "bg-black/60 border-white/10"
              }`}
            >
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Table View with Thumbnails"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Table View</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Grid Cards View with Media"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono pt-1">
            <span
              className={`flex items-center gap-1 font-semibold uppercase text-[10px] ${
                isLight ? "text-slate-600" : "text-zinc-500"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Filters:
            </span>

            {/* Prototype Readiness Filter */}
            <select
              value={prototypeStatusFilter}
              onChange={(e) => setPrototypeStatusFilter(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 cursor-pointer ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-800"
                  : "bg-black/60 border-white/10 text-zinc-300"
              }`}
            >
              <option value="all">All Prototypes</option>
              <option value="fully_working">Fully Working</option>
              <option value="minor_limitations">Minor Limitations</option>
              <option value="no_prototype">No Prototype</option>
            </select>

            {/* Affiliation Filter */}
            <select
              value={affiliationFilter}
              onChange={(e) => setAffiliationFilter(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 cursor-pointer ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-800"
                  : "bg-black/60 border-white/10 text-zinc-300"
              }`}
            >
              <option value="all">All Affiliations</option>
              <option value="all_aliah">All Aliah</option>
              <option value="all_other">External Institution</option>
              <option value="mixed">Mixed Team</option>
            </select>

            {/* Email Status Filter */}
            <select
              value={emailStatusFilter}
              onChange={(e) => setEmailStatusFilter(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 cursor-pointer ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-800"
                  : "bg-black/60 border-white/10 text-zinc-300"
              }`}
            >
              <option value="all">All Email Statuses</option>
              <option value="sent">Email Sent</option>
              <option value="pending">Email Pending</option>
              <option value="failed">Email Failed</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Results Count */}
            <div
              className={`ml-auto text-[11px] ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}
            >
              Showing{" "}
              <strong className={isLight ? "text-slate-900" : "text-white"}>
                {filteredRegistrations.length}
              </strong>{" "}
              of {registrations.length} registrations
            </div>
          </div>
        </section>

        {/* DATA PRESENTATION: TABLE VIEW OR GRID CARDS VIEW */}
        {loading ? (
          <div
            className={`p-16 flex flex-col items-center justify-center ${
              isLight ? "text-slate-500" : "text-zinc-400"
            }`}
          >
            <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-mono tracking-widest uppercase">
              Loading Registrations Database...
            </p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div
            className={`p-16 rounded-2xl border text-center space-y-3 ${
              isLight
                ? "bg-white border-slate-200 text-slate-800 shadow-sm"
                : "bg-zinc-950/40 border-white/10 text-white"
            }`}
          >
            <Cpu
              className={`w-12 h-12 mx-auto ${
                isLight ? "text-slate-400" : "text-zinc-600"
              }`}
            />
            <h3
              className={`text-lg font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              No registrations match
            </h3>
            <p
              className={`text-xs font-mono max-w-md mx-auto ${
                isLight ? "text-slate-500" : "text-zinc-500"
              }`}
            >
              No registration entries match your current search and filter combination. Try clearing some filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW WITH PROMINENT CLOUDINARY IMAGES */
          <div
            className={`rounded-2xl border overflow-hidden transition-colors ${
              isLight
                ? "border-slate-200/90 bg-white shadow-md text-slate-800"
                : "border-white/10 bg-zinc-950/70 backdrop-blur-md shadow-2xl text-white"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-mono tracking-wider uppercase ${
                      isLight
                        ? "bg-slate-100/90 border-slate-200 text-slate-700 font-bold"
                        : "bg-zinc-900/50 border-white/10 text-zinc-400"
                    }`}
                  >
                    <th className="py-3.5 px-3">Reg ID</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-amber-500 transition-colors"
                      onClick={() => toggleSort("teamName")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Team & Leader</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    {/* Visual Media Columns */}
                    <th className="py-3.5 px-4">College ID Cards</th>
                    <th className="py-3.5 px-4">Abstract (PDF & Image)</th>
                    <th className="py-3.5 px-4">Project Title</th>
                    <th className="py-3.5 px-4">Readiness</th>
                    <th className="py-3.5 px-4">Affiliation</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y font-mono ${
                    isLight ? "divide-slate-100" : "divide-white/5"
                  }`}
                >
                  {paginatedRegistrations.map((reg) => {
                    const cards = extractIdCards(reg);
                    const pdfPreview = reg.abstractPdf
                      ? getPdfPreviewUrl(reg.abstractPdf)
                      : null;

                    return (
                      <tr
                        key={reg._id}
                        onClick={() => setSelectedRegistration(reg)}
                        className={`transition-colors cursor-pointer group ${
                          isLight
                            ? "hover:bg-slate-50/90 text-slate-700"
                            : "hover:bg-white/[0.03] text-zinc-200"
                        }`}
                      >
                        {/* Reg ID */}
                        <td className="py-3.5 px-3 font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {reg.registrationId || "—"}
                        </td>

                        {/* Team & Leader */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div
                            className={`font-sans font-bold text-sm transition-colors ${
                              isLight
                                ? "text-slate-900 group-hover:text-amber-600"
                                : "text-white group-hover:text-amber-300"
                            }`}
                          >
                            {reg.teamName}
                          </div>
                          <div
                            className={`text-[11px] flex items-center gap-2 mt-0.5 ${
                              isLight ? "text-slate-500" : "text-zinc-400"
                            }`}
                          >
                            <span>{reg.teamLeaderName}</span>
                            <span className="text-zinc-400">·</span>
                            <span>{reg.teamLeaderPhone}</span>
                          </div>
                        </td>

                        {/* VISUAL COLUMN 1: COLLEGE ID CARDS THUMBNAILS */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {cards.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {cards.map((card, cIdx) => (
                                <div
                                  key={cIdx}
                                  onClick={(e) => openLightboxForCard(card, reg, e)}
                                  className={`relative group/thumb w-10 h-8 rounded-md overflow-hidden border transition-all cursor-pointer shadow-sm hover:scale-110 z-10 ${
                                    isLight
                                      ? "bg-slate-100 border-slate-300 hover:border-amber-500"
                                      : "bg-black/60 border-white/15 hover:border-amber-400"
                                  }`}
                                  title={`Click to inspect ${card.role}: ${card.name}`}
                                >
                                  <img
                                    src={card.thumb}
                                    alt={card.role}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="w-2.5 h-2.5 text-amber-400" />
                                  </div>
                                </div>
                              ))}
                              <span
                                className={`text-[10px] font-mono ml-1 ${
                                  isLight ? "text-slate-400" : "text-zinc-500"
                                }`}
                              >
                                ({cards.length})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">No Cards</span>
                          )}
                        </td>

                        {/* VISUAL COLUMN 2: ABSTRACT PDF & IMAGE PREVIEW */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {reg.abstractPdf ? (
                            <div className="flex items-center gap-2">
                              {/* Page 1 Thumbnail Image */}
                              <div
                                onClick={(e) => openLightboxForPdf(reg, e)}
                                className={`relative group/pdf w-9 h-11 rounded-md overflow-hidden border transition-all cursor-pointer shadow-md hover:scale-105 shrink-0 ${
                                  isLight
                                    ? "bg-slate-100 border-purple-300 hover:border-purple-500"
                                    : "bg-black/80 border-purple-500/30 hover:border-purple-400"
                                }`}
                                title="Click to view Page 1 PDF Image Preview"

                              >
                                <img
                                  src={pdfPreview}
                                  alt="Abstract PDF Preview"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pdf:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-3 h-3 text-purple-300" />
                                </div>
                              </div>

                              {/* Direct Links */}
                              <div className="flex flex-col text-[10px] leading-tight">
                                <button
                                  onClick={(e) => openLightboxForPdf(reg, e)}
                                  className={`font-bold flex items-center gap-1 cursor-pointer text-left ${
                                    isLight
                                      ? "text-amber-700 hover:text-amber-800"
                                      : "text-amber-400 hover:text-amber-300"
                                  }`}
                                >
                                  <FileText className="w-3 h-3 shrink-0" />
                                  <span>View PDF</span>
                                </button>
                                <a
                                  href={reg.abstractPdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1 mt-0.5 ${
                                    isLight
                                      ? "text-slate-500 hover:text-slate-800"
                                      : "text-zinc-500 hover:text-zinc-300"
                                  }`}
                                >
                                  <span>Download</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">No PDF</span>
                          )}
                        </td>

                        {/* Project Title */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div
                            className={`font-sans font-medium truncate ${
                              isLight ? "text-slate-800" : "text-zinc-200"
                            }`}
                            title={reg.projectTitle}
                          >
                            {reg.projectTitle}
                          </div>
                          <div
                            className={`text-[10px] truncate mt-0.5 ${
                              isLight ? "text-slate-500" : "text-zinc-400"
                            }`}
                          >
                            {reg.prototypeType}
                          </div>
                        </td>

                        {/* Readiness */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {reg.hasWorkingPrototype === "fully_working" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                              Fully Working
                            </span>
                          ) : reg.hasWorkingPrototype === "minor_limitations" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold">
                              Minor Limitations
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold">
                              No Prototype
                            </span>
                          )}
                        </td>

                        {/* Affiliation */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {reg.teamAffiliation === "all_aliah" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
                              Aliah
                            </span>
                          ) : reg.teamAffiliation === "all_other" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-semibold">
                              External
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold">
                              Mixed
                            </span>
                          )}
                        </td>

                        {/* Email Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {reg.emailStatus === "sent" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : reg.emailStatus === "failed" ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 text-[11px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Failed
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1 text-[11px]">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRegistration(reg)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ml-auto cursor-pointer font-bold ${
                              isLight
                                ? "bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-black border-amber-300"
                                : "bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/30"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View All</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARDS VIEW WITH PROMINENT CLOUDINARY IMAGES */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedRegistrations.map((reg) => {
              const cards = extractIdCards(reg);
              const pdfPreview = reg.abstractPdf
                ? getPdfPreviewUrl(reg.abstractPdf)
                : null;

              return (
                <div
                  key={reg._id}
                  onClick={() => setSelectedRegistration(reg)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group space-y-4 ${
                    isLight
                      ? "bg-white border-slate-200/90 shadow-sm hover:shadow-lg hover:border-amber-400 text-slate-800"
                      : "bg-zinc-950/70 border-white/10 backdrop-blur-md hover:border-amber-500/40 shadow-xl text-white"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                          isLight
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        }`}
                      >
                        {reg.registrationId || "PENDING"}
                      </span>
                      {reg.hasWorkingPrototype === "fully_working" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          Fully Working
                        </span>
                      ) : reg.hasWorkingPrototype === "minor_limitations" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold">
                          Minor Limitations
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold">
                          No Prototype
                        </span>
                      )}
                    </div>

                    {/* Team & Project Header */}
                    <div>
                      <h3
                        className={`font-heading text-lg font-bold transition-colors ${
                          isLight
                            ? "text-slate-900 group-hover:text-amber-600"
                            : "text-white group-hover:text-amber-300"
                        }`}
                      >
                        {reg.teamName}
                      </h3>
                      <p
                        className={`text-xs font-sans line-clamp-1 mt-0.5 font-medium ${
                          isLight ? "text-slate-600" : "text-zinc-300"
                        }`}
                      >
                        {reg.projectTitle}
                      </p>
                    </div>

                    {/* CLOUDINARY VISUAL SHOWCASE ON THE CARD */}
                    <div
                      className={`p-3 rounded-xl border space-y-2.5 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-black/60 border-white/10"
                      }`}
                    >
                      {/* ID Cards Section */}
                      <div>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1.5 flex items-center gap-1 ${
                            isLight ? "text-slate-600" : "text-zinc-400"
                          }`}
                        >
                          <ImageIcon className="w-3 h-3 text-cyan-500" />
                          College ID Cards ({cards.length})
                        </span>
                        {cards.length > 0 ? (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
                            {cards.map((card, cIdx) => (
                              <div
                                key={cIdx}
                                onClick={(e) => openLightboxForCard(card, reg, e)}
                                className={`w-14 h-10 rounded-md overflow-hidden border transition-all cursor-pointer shadow-md hover:scale-105 shrink-0 relative group/cardimg ${
                                  isLight
                                    ? "bg-white border-slate-300 hover:border-amber-500"
                                    : "bg-zinc-900 border-white/10 hover:border-amber-400"
                                }`}
                                title={`${card.role}: ${card.name}`}
                              >
                                <img
                                  src={card.thumb}
                                  alt={card.role}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/cardimg:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-3 h-3 text-amber-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400 italic">No cards</span>
                        )}
                      </div>

                      {/* Abstract PDF Preview Image & Link */}
                      {reg.abstractPdf && (
                        <div
                          className={`pt-2 border-t flex items-center justify-between gap-2 ${
                            isLight ? "border-slate-200" : "border-white/5"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            onClick={(e) => openLightboxForPdf(reg, e)}
                            className="flex items-center gap-2 cursor-pointer group/pdfbar"
                          >
                            <div
                              className={`w-8 h-10 rounded overflow-hidden border transition-colors shrink-0 ${
                                isLight
                                  ? "bg-white border-purple-300 group-hover/pdfbar:border-purple-500"
                                  : "bg-zinc-900 border-purple-500/30 group-hover/pdfbar:border-purple-400"
                              }`}
                            >
                              <img
                                src={pdfPreview}
                                alt="PDF Cover"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="text-[11px] font-mono">
                              <span
                                className={`font-bold block group-hover/pdfbar:underline ${
                                  isLight ? "text-amber-700" : "text-amber-400"
                                }`}
                              >
                                Abstract PDF
                              </span>
                              <span
                                className={`text-[10px] truncate max-w-[120px] block ${
                                  isLight ? "text-slate-500" : "text-zinc-500"
                                }`}
                              >
                                {reg.abstractPdfOriginalName || "View Document"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => openLightboxForPdf(reg, e)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? "bg-white hover:bg-slate-200 border-slate-300 text-slate-700"
                                : "bg-white/[0.05] hover:bg-white/15 border-white/10 text-zinc-300 hover:text-white"
                            }`}
                            title="Open PDF Reader"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
                      isLight ? "border-slate-200 text-slate-600" : "border-white/5 text-zinc-400"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>
                        {reg.teamLeaderName}
                      </span>
                      <span
                        className={`block text-[10px] truncate ${
                          isLight ? "text-slate-500" : "text-zinc-500"
                        }`}
                      >
                        {reg.teamLeaderEmail}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegistration(reg);
                      }}
                      className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 font-bold flex items-center gap-1 ${
                        isLight
                          ? "bg-slate-100 hover:bg-amber-500 hover:text-black border-slate-300 text-slate-800"
                          : "bg-white/[0.06] hover:bg-amber-500 hover:text-black border-white/10 text-zinc-200"
                      }`}
                      title="View Full Details"
                    >
                      <span>Full Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS BAR (10 ITEMS PER PAGE) */}
        {filteredRegistrations.length > 0 && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors font-mono text-xs ${
              isLight
                ? "bg-white border-slate-200/90 shadow-sm text-slate-700"
                : "bg-zinc-950/70 border-white/10 text-zinc-300"
            }`}
          >
            {/* Left: Summary & Page Size Selector */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Showing{" "}
                <strong className={isLight ? "text-slate-900" : "text-white"}>
                  {startRecord}
                </strong>
                –
                <strong className={isLight ? "text-slate-900" : "text-white"}>
                  {endRecord}
                </strong>{" "}
                of{" "}
                <strong className={isLight ? "text-slate-900" : "text-white"}>
                  {filteredRegistrations.length}
                </strong>{" "}
                teams
              </span>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>
                  Per page:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`border rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer ${
                    isLight
                      ? "bg-slate-50 border-slate-300 text-slate-800"
                      : "bg-black/60 border-white/10 text-zinc-200"
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-white/[0.04] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-white/[0.04] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((num, idx) => {
                  if (num === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className={`px-2 py-1 text-xs select-none ${
                          isLight ? "text-slate-400" : "text-zinc-600"
                        }`}
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = num === validCurrentPage;
                  return (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500 text-black shadow-md scale-105"
                          : isLight
                          ? "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700"
                          : "bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-white/[0.04] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-white/[0.04] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>


      {/* DETAIL MODAL */}
      {selectedRegistration && (
        <RegistrationDetailModal
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
        />
      )}

      {/* STANDALONE IMAGE / PDF LIGHTBOX OVERLAY */}
      {activeLightbox && (
        <ImageLightbox
          media={activeLightbox}
          onClose={() => setActiveLightbox(null)}
        />
      )}
    </div>
  );
}
