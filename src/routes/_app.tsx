import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isDemo, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      navigate({ to: "/login" });
    }
  }, [user, isDemo, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!user && !isDemo) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}