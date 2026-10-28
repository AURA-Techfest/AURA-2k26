import React, { createContext, useContext, useState, useEffect } from "react";

const AdminThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  isLight: false,
});

const THEME_STORAGE_KEY = "aura_admin_theme";

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "light" ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  });

  const isLight = theme === "light";

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {}

    // Apply or remove body class specifically for admin pages
    if (isLight) {
      document.body.classList.add("admin-light-mode");
    } else {
      document.body.classList.remove("admin-light-mode");
    }

    return () => {
      document.body.classList.remove("admin-light-mode");
    };
  }, [theme, isLight]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, isLight, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
export default AdminThemeContext;
