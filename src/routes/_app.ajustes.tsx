import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes de inventario — POS Minimarket" }] }),
  component: AjustesPage,
});

function AjustesPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("ajustes_inventario").select("id,motivo,observaciones,fecha,creado_en").order("creado_en", { ascending: false });
      setRows(data ?? []); setLoading(false);
    })();
  }, [user?.id, isDemo]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Sliders className="h-6 w-6 text-primary" /> Ajustes de inventario</h1>
        <p className="text-muted-foreground">Conteos y diferencias de stock</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Motivo</th><th className="px-4 py-2">Observaciones</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Sin ajustes</td></tr>
            : rows.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2 text-xs">{formatDate(a.fecha)}</td>
                <td className="px-4 py-2"><Badge variant="secondary">{a.motivo}</Badge></td>
                <td className="px-4 py-2 text-muted-foreground">{a.observaciones ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}