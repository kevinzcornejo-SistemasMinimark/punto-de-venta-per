import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/guia")({
  head: () => ({ meta: [{ title: "Guías de remisión — POS Minimarket" }] }),
  component: GuiasPage,
});

function GuiasPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("ventas").select("id,serie,correlativo,total,estado,creada_en,clientes(razon_social,nombres)").eq("tipo_comprobante", "GUIA_REMISION").order("creada_en", { ascending: false });
      setRows(data ?? []); setLoading(false);
    })();
  }, [user?.id, isDemo]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Guías de remisión</h1>
        <p className="text-muted-foreground">Traslados y envíos registrados</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr><th className="px-4 py-2">Guía</th><th className="px-4 py-2">Cliente</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Fecha</th><th className="px-4 py-2 text-right">Total</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin guías emitidas</td></tr>
            : rows.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{g.serie}-{String(g.correlativo).padStart(8, "0")}</td>
                <td className="px-4 py-2">{g.clientes?.razon_social ?? g.clientes?.nombres ?? "—"}</td>
                <td className="px-4 py-2"><Badge variant="secondary">{g.estado}</Badge></td>
                <td className="px-4 py-2 text-xs">{new Date(g.creada_en).toLocaleString("es-PE")}</td>
                <td className="px-4 py-2 text-right font-semibold">{formatPEN(g.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}