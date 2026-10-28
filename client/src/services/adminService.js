const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  rawApiUrl && rawApiUrl !== "undefined"
    ? rawApiUrl.replace(/\/$/, "")
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

const TOKEN_KEY = "aura_admin_token";
const USER_KEY = "aura_admin_user";

/**
 * Retrieve the current stored token
 */
export const getAdminToken = () => {
  return localStorage.getItem(TOKEN_KEY) || "";
};

/**
 * Retrieve the stored admin user details
 */
export const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Check if a token currently exists
 */
export const isAdminAuthenticated = () => {
  return Boolean(getAdminToken());
};

/**
 * Store credentials upon successful login
 */
export const setAdminSession = (token, admin) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(admin || {}));
};

/**
 * Clear credentials upon logout
 */
export const clearAdminSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Helper for making authenticated requests to admin endpoints
 */
const authFetch = async (endpoint, options = {}) => {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAdminSession();
    // Dispatch custom event so UI can react and redirect if needed
    window.dispatchEvent(new Event("aura_admin_unauthorized"));
  }

  return response;
};

/**
 * Admin Login API
 */
export const loginAdmin = async (userId, password) => {
  const url = `${API_URL}/api/admin/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, password }),
  });

  const data = await response.json();
  if (response.ok && data.success) {
    setAdminSession(data.token, data.admin);
    return data;
  }

  throw new Error(data.message || "Authentication failed");
};

/**
 * Verify current session with server
 */
export const verifyAdminSession = async () => {
  const token = getAdminToken();
  if (!token) return { valid: false };

  try {
    const res = await authFetch("/api/admin/verify");
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: Boolean(data.success), admin: data.admin };
  } catch (err) {
    return { valid: false };
  }
};

/**
 * Fetch all registrations with search and filtering
 */
export const fetchRegistrations = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.affiliation && filters.affiliation !== "all") {
    params.append("affiliation", filters.affiliation);
  }
  if (filters.prototypeStatus && filters.prototypeStatus !== "all") {
    params.append("prototypeStatus", filters.prototypeStatus);
  }
  if (filters.emailStatus && filters.emailStatus !== "all") {
    params.append("emailStatus", filters.emailStatus);
  }
  if (filters.feeStatus && filters.feeStatus !== "all") {
    params.append("feeStatus", filters.feeStatus);
  }
  if (filters.prototypeType && filters.prototypeType !== "all") {
    params.append("prototypeType", filters.prototypeType);
  }
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/admin/registrations${queryString}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch registrations");
  }

  return data;
};

/**
 * Fetch detailed stats for admin metrics cards
 */
export const fetchAdminStats = async () => {
  const res = await authFetch("/api/admin/stats");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch dashboard statistics");
  }

  return data.stats;
};

/**
 * Fetch single registration details
 */
export const fetchRegistrationById = async (id) => {
  const res = await authFetch(`/api/admin/registrations/${id}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch registration details");
  }

  return data.registration;
};

/**
 * Download registrations as CSV
 */
export const downloadRegistrationsCsv = async () => {
  const token = getAdminToken();
  const url = `${API_URL}/api/admin/export/csv?token=${encodeURIComponent(token)}`;

  // Direct trigger via anchor tag
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `aura2k26_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
