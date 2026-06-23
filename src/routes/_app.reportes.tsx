import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({ meta: [{ title: "Reportes — POS Minimarket" }] }),
  component: ReportesPage,
});

type Venta = { creada_en: string; total: number; metodo_pago: string; tipo_comprobante: string };

function ReportesPage() {
  const { user, isDemo } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastosTotal, setGastosTotal] = useState(0);

  useEffect(() => {
    if (isDemo || !user) return;
    (async () => {
      const desde = new Date(); desde.setDate(desde.getDate() - 30);
      const { data } = await supabase.from("ventas").select("creada_en,total,metodo_pago,tipo_comprobante").gte("creada_en", desde.toISOString()).neq("estado", "ANULADA");
      setVentas((data ?? []) as any);
      const { data: g } = await supabase.from("gastos").select("monto").gte("fecha", desde.toISOString().slice(0, 10));
      setGastosTotal((g ?? []).reduce((s: number, r: any) => s + Number(r.monto), 0));
    })();
  }, [user?.id, isDemo]);

  const stats = useMemo(() => {
    const total = ventas.reduce((s, v) => s + Number(v.total), 0);
    const count = ventas.length;
    const promedio = count ? total / count : 0;
    const porMetodo: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    const porDia: Record<string, number> = {};
    ventas.forEach((v) => {
      porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + Number(v.total);
      porTipo[v.tipo_comprobante] = (porTipo[v.tipo_comprobante] ?? 0) + Number(v.total);
      const d = v.creada_en.slice(0, 10);
      porDia[d] = (porDia[d] ?? 0) + Number(v.total);
    });
    return { total, count, promedio, porMetodo, porTipo, porDia };
  }, [ventas]);

  const maxDia = Math.max(...Object.values(stats.porDia), 1);
  const dias = Object.entries(stats.porDia).sort(([a], [b]) => a.localeCompare(b)).slice(-14);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Reportes</h1>
        <p className="text-muted-foreground">Últimos 30 días</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Ventas</div><div className="text-2xl font-bold text-primary">{formatPEN(stats.total)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Transacciones</div><div className="text-2xl font-bold">{stats.count}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Ticket promedio</div><div className="text-2xl font-bold">{formatPEN(stats.promedio)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Utilidad bruta</div><div className="text-2xl font-bold text-emerald-600">{formatPEN(stats.total - gastosTotal)}</div></Card>
      </div>

      <Card className="p-4">
        <div className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Ventas por día (últimos 14)</div>
        <div className="flex items-end gap-1 h-40">
          {dias.length === 0 ? <div className="text-sm text-muted-foreground m-auto">Sin datos</div>
          : dias.map(([d, v]) => (
            <div key={d} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="text-[10px] font-mono opacity-0 group-hover:opacity-100">{formatPEN(v)}</div>
              <div className="w-full bg-primary rounded-t" style={{ height: `${(v / maxDia) * 100}%` }} />
              <div className="text-[10px] text-muted-foreground">{d.slice(5)}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="font-semibold mb-3">Por método de pago</div>
          {Object.entries(stats.porMetodo).length === 0 ? <div className="text-sm text-muted-foreground">Sin datos</div>
          : Object.entries(stats.porMetodo).sort(([, a], [, b]) => b - a).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 text-sm border-b last:border-0">
              <span className="font-mono text-xs">{k}</span><span className="font-semibold">{formatPEN(v)}</span>
            </div>
          ))}
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-3">Por tipo de comprobante</div>
          {Object.entries(stats.porTipo).length === 0 ? <div className="text-sm text-muted-foreground">Sin datos</div>
          : Object.entries(stats.porTipo).sort(([, a], [, b]) => b - a).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 text-sm border-b last:border-0">
              <span className="font-mono text-xs">{k}</span><span className="font-semibold">{formatPEN(v)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}