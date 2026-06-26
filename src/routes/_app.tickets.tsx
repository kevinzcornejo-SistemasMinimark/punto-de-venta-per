import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Search,
  Filter,
  Calendar,
  Printer,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from "lucide-react";
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

type RangoPreset = "hoy" | "ayer" | "semana" | "mes" | "rango";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function TicketsPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [preset, setPreset] = useState<RangoPreset>("hoy");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState<string>("TODOS");
  const [metodo, setMetodo] = useState<string>("TODOS");
  const [estado, setEstado] = useState<string>("TODOS");

  const cargar = async () => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("ventas")
      .select("id,correlativo,serie,tipo_comprobante,total,metodo_pago,estado,creada_en,clientes(razon_social,nombres)")
      .order("creada_en", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isDemo]);

  // Calcular rango según preset
  const { from, to } = useMemo(() => {
    const now = new Date();
    if (preset === "hoy") return { from: startOfDay(now), to: endOfDay(now) };
    if (preset === "ayer") {
      const a = new Date(now); a.setDate(a.getDate() - 1);
      return { from: startOfDay(a), to: endOfDay(a) };
    }
    if (preset === "semana") {
      const a = new Date(now); a.setDate(a.getDate() - 7);
      return { from: startOfDay(a), to: endOfDay(now) };
    }
    if (preset === "mes") {
      const a = new Date(now); a.setDate(a.getDate() - 30);
      return { from: startOfDay(a), to: endOfDay(now) };
    }
    return {
      from: desde ? startOfDay(new Date(desde)) : null,
      to: hasta ? endOfDay(new Date(hasta)) : null,
    };
  }, [preset, desde, hasta]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return rows.filter((r) => {
      const d = new Date(r.creada_en);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (tipo !== "TODOS" && r.tipo_comprobante !== tipo) return false;
      if (metodo !== "TODOS" && r.metodo_pago !== metodo) return false;
      if (estado !== "TODOS" && r.estado !== estado) return false;
      if (k) {
        const haystack = `${r.serie}-${r.correlativo} ${r.tipo_comprobante} ${r.clientes?.razon_social ?? ""} ${r.clientes?.nombres ?? ""}`.toLowerCase();
        if (!haystack.includes(k)) return false;
      }
      return true;
    });
  }, [rows, q, from, to, tipo, metodo, estado]);

  const totalPeriodo = useMemo(
    () => filtered.reduce((s, r) => s + Number(r.total || 0), 0),
    [filtered],
  );

  const tiposUnicos = useMemo(
    () => Array.from(new Set(rows.map((r) => r.tipo_comprobante))).filter(Boolean),
    [rows],
  );
  const metodosUnicos = useMemo(
    () => Array.from(new Set(rows.map((r) => r.metodo_pago))).filter(Boolean),
    [rows],
  );

  const exportarCSV = () => {
    const headers = ["Comprobante", "Tipo", "Cliente", "Metodo", "Estado", "Fecha", "Total"];
    const lines = filtered.map((v) => [
      `${v.serie}-${String(v.correlativo).padStart(8, "0")}`,
      v.tipo_comprobante,
      (v.clientes?.razon_social ?? v.clientes?.nombres ?? "").replace(/,/g, " "),
      v.metodo_pago,
      v.estado,
      new Date(v.creada_en).toLocaleString("es-PE"),
      Number(v.total).toFixed(2),
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const limpiarFiltros = () => {
    setQ(""); setTipo("TODOS"); setMetodo("TODOS"); setEstado("TODOS");
    setPreset("hoy"); setDesde(""); setHasta("");
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Ticket className="h-7 w-7 text-primary" /> Tickets
          </h1>
          <p className="text-muted-foreground">Historial de ventas y reimpresión</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 font-semibold"><Printer className="h-4 w-4 mr-2" /> IMP-Ticket</Button>
          <Button variant="outline" className="h-10 font-semibold" onClick={exportarCSV}><FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Excel</Button>
          <Button variant="outline" className="h-10 font-semibold"><FileText className="h-4 w-4 mr-2 text-rose-600" /> PDF</Button>
          <Button variant="outline" className="h-10 font-semibold" onClick={cargar}><RefreshCw className="h-4 w-4 mr-2 text-blue-600" /> Actualizar</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {([
              ["hoy", "Hoy"],
              ["ayer", "Ayer"],
              ["semana", "Semana"],
              ["mes", "Mes"],
              ["rango", "Rango"],
            ] as [RangoPreset, string][]).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPreset(k)}
                className={`h-9 px-4 rounded-full text-sm font-bold border transition ${
                  preset === k
                    ? "bg-emerald-500 text-white border-emerald-500 shadow"
                    : "bg-card hover:bg-muted border-border"
                }`}
              >
                {k === "hoy" && <Calendar className="h-3.5 w-3.5 inline mr-1.5" />}
                {l}
              </button>
            ))}
          </div>
          {preset === "rango" && (
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Desde:</label>
                <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-40" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Hasta:</label>
                <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-40" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-9 px-3 rounded-md border bg-card text-sm font-semibold">
              <option value="TODOS">Todos los tipos</option>
              {tiposUnicos.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="h-9 px-3 rounded-md border bg-card text-sm font-semibold">
              <option value="TODOS">Todos los métodos</option>
              {metodosUnicos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-9 px-3 rounded-md border bg-card text-sm font-semibold">
              <option value="TODOS">Todos los estados</option>
              <option value="PAGADA">PAGADA</option>
              <option value="ANULADA">ANULADA</option>
              <option value="PENDIENTE">PENDIENTE</option>
            </select>
          </div>
        </Card>

        <Card className="p-4 flex flex-col items-center justify-center bg-emerald-50/60 border-emerald-200">
          <div className="text-xs font-semibold text-muted-foreground">Total Período</div>
          <div className="text-3xl font-extrabold text-emerald-600">{formatPEN(totalPeriodo)}</div>
          <div className="text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 && "s"}</div>
        </Card>
      </div>

      {/* Buscador */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número de ticket, tipo o cliente…"
            className="pl-9 h-11 rounded-full bg-card"
          />
        </div>
        <Button variant="ghost" onClick={limpiarFiltros} className="h-11 font-semibold">Limpiar</Button>
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