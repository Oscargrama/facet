import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Persists the last visited route and restores it on app reload/focus.
 * - Saves every internal navigation to localStorage (last_route)
 * - On mount (when authenticated), if current route is root and a last route exists, restores it
 */
export default function RoutePersistence() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  // Save route on every change
  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    // Avoid saving auth route as last route
    if (!path.startsWith("/auth")) {
      try {
        localStorage.setItem("last_route", path);
      } catch {}
    }
  }, [location.pathname, location.search, location.hash]);

  // Restore last route on mount if we land on root unexpectedly
  useEffect(() => {
    if (restoredRef.current) return;
    if (!user) return; // only restore for authenticated users

    const current = `${location.pathname}${location.search}${location.hash}`;
    // Only auto-restore if we land on root or auth accidentally
    if (current === "/" || current === "") {
      const last = localStorage.getItem("last_route");
      if (last && last !== "/" && !last.startsWith("/auth")) {
        restoredRef.current = true;
        navigate(last, { replace: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return null;
}
