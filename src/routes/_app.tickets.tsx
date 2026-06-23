import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/tickets")({
  head: () => ({ meta: [{ title: "Tickets — POS Minimarket" }] }),
  component: TicketsPage,
});

type Venta = {
  id: string;
  correlativo: number;
  serie: string;
  tipo_comprobante: string;
  total: number;
  metodo_pago: string;
  estado: string;
  creada_en: string;
  clientes: { razon_social: string | null; nombres: string | null } | null;
};

function TicketsPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ventas")
        .select("id,correlativo,serie,tipo_comprobante,total,metodo_pago,estado,creada_en,clientes(razon_social,nombres)")
        .order("creada_en", { ascending: false })
        .limit(200);
      if (error) toast.error(error.message);
      setRows((data ?? []) as any); setLoading(false);
    })();
  }, [user?.id, isDemo]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter((r) =>
      `${r.serie}-${r.correlativo}`.toLowerCase().includes(k) ||
      r.tipo_comprobante.toLowerCase().includes(k) ||
      (r.clientes?.razon_social ?? r.clientes?.nombres ?? "").toLowerCase().includes(k),
    );
  }, [rows, q]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Ticket className="h-6 w-6 text-primary" /> Tickets / Ventas</h1>
        <p className="text-muted-foreground">Histórico de ventas registradas</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar serie, tipo o cliente…" className="pl-9" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr><th className="px-4 py-2">Comprobante</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Cliente</th><th className="px-4 py-2">Método</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Fecha</th><th className="px-4 py-2 text-right">Total</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin ventas</td></tr>
            : filtered.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{v.serie}-{String(v.correlativo).padStart(8, "0")}</td>
                <td className="px-4 py-2"><Badge variant="secondary">{v.tipo_comprobante}</Badge></td>
                <td className="px-4 py-2">{v.clientes?.razon_social ?? v.clientes?.nombres ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{v.metodo_pago}</td>
                <td className="px-4 py-2"><Badge variant={v.estado === "PAGADA" ? "default" : v.estado === "ANULADA" ? "destructive" : "secondary"}>{v.estado}</Badge></td>
                <td className="px-4 py-2 text-xs">{new Date(v.creada_en).toLocaleString("es-PE")}</td>
                <td className="px-4 py-2 text-right font-bold">{formatPEN(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}