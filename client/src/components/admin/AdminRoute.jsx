import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminAuthenticated, verifyAdminSession } from "../../services/adminService";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (!isAdminAuthenticated()) {
        if (isMounted) {
          setAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      const { valid } = await verifyAdminSession();
      if (isMounted) {
        setAuthenticated(valid);
        setLoading(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      if (isMounted) {
        setAuthenticated(false);
      }
    };

    window.addEventListener("aura_admin_unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("aura_admin_unauthorized", handleUnauthorized);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0909] flex flex-col items-center justify-center text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <Loader2 className="w-6 h-6 text-amber-500 animate-pulse absolute" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
