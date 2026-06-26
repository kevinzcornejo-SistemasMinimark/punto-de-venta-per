import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, FileSpreadsheet, Printer, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPEN } from "@/lib/format";
import { exportToCSV, printHTML } from "@/lib/exporters";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({ meta: [{ title: "Reportes — POS Minimarket" }] }),
  component: ReportesPage,
});

type Venta = { creada_en: string; total: number; metodo_pago: string; tipo_comprobante: string };
const COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

function ReportesPage() {
  const { user, isDemo } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastosTotal, setGastosTotal] = useState(0);
  const [rango, setRango] = useState<7 | 15 | 30 | 90>(30);

  useEffect(() => {
    if (isDemo || !user) return;
    (async () => {
      const desde = new Date(); desde.setDate(desde.getDate() - rango);
      const { data } = await supabase.from("ventas")
        .select("creada_en,total,metodo_pago,tipo_comprobante")
        .gte("creada_en", desde.toISOString())
        .neq("estado", "ANULADA");
      setVentas((data ?? []) as any);
      const { data: g } = await supabase.from("gastos")
        .select("monto").gte("fecha", desde.toISOString().slice(0, 10));
      setGastosTotal((g ?? []).reduce((s: number, r: any) => s + Number(r.monto), 0));
    })();
  }, [user?.id, isDemo, rango]);

  const stats = useMemo(() => {
    const total = ventas.reduce((s, v) => s + Number(v.total), 0);
    const count = ventas.length;
    const promedio = count ? total / count : 0;
    const porMetodo: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    const porDia: Record<string, { dia: string; ventas: number; trans: number }> = {};
    ventas.forEach((v) => {
      porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + Number(v.total);
      porTipo[v.tipo_comprobante] = (porTipo[v.tipo_comprobante] ?? 0) + Number(v.total);
      const k = v.creada_en.slice(0, 10);
      if (!porDia[k]) porDia[k] = { dia: k.slice(5), ventas: 0, trans: 0 };
      porDia[k].ventas += Number(v.total);
      porDia[k].trans += 1;
    });
    return {
      total, count, promedio,
      metodos: Object.entries(porMetodo).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })),
      tipos: Object.entries(porTipo).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })),
      serie: Object.values(porDia).sort((a, b) => a.dia.localeCompare(b.dia)),
    };
  }, [ventas]);

  const exportarCSV = () => {
    exportToCSV(`reporte-ventas-${rango}d`, stats.serie.map((d) => ({
      Día: d.dia, Ventas: d.ventas.toFixed(2), Transacciones: d.trans,
    })));
  };

  const imprimirPDF = () => {
    const filas = stats.serie.map((d) => `<tr><td>${d.dia}</td><td class="right">${d.trans}</td><td class="right">${formatPEN(d.ventas)}</td></tr>`).join("");
    const metodos = stats.metodos.map((m) => `<tr><td>${m.name}</td><td class="right">${formatPEN(m.value)}</td></tr>`).join("");
    printHTML(`Reporte de ventas ${rango}d`, `
      <h1>Reporte de ventas — últimos ${rango} días</h1>
      <div class="meta">Generado: ${new Date().toLocaleString("es-PE")}</div>
      <div style="display:flex;gap:20px;margin:14px 0;flex-wrap:wrap">
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase">Ventas totales</div><div class="total">${formatPEN(stats.total)}</div></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase">Transacciones</div><div class="total">${stats.count}</div></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase">Ticket promedio</div><div class="total">${formatPEN(stats.promedio)}</div></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase">Gastos</div><div class="total" style="color:#dc2626">${formatPEN(gastosTotal)}</div></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase">Utilidad bruta</div><div class="total">${formatPEN(stats.total - gastosTotal)}</div></div>
      </div>
      <h2 style="font-size:13px;margin-top:18px">Ventas por día</h2>
      <table><thead><tr><th>Día</th><th class="right">Transacciones</th><th class="right">Ventas</th></tr></thead><tbody>${filas}</tbody></table>
      <h2 style="font-size:13px;margin-top:18px">Por método de pago</h2>
      <table><thead><tr><th>Método</th><th class="right">Monto</th></tr></thead><tbody>${metodos}</tbody></table>
    `);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Reportes
          </h1>
          <p className="text-muted-foreground">Análisis de ventas — últimos {rango} días</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 bg-card rounded-lg border p-1">
            {([7, 15, 30, 90] as const).map((r) => (
              <button key={r} onClick={() => setRango(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md ${rango === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Calendar className="h-3 w-3 inline mr-1" />{r}d
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={exportarCSV} className="font-semibold">
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />Excel
          </Button>
          <Button variant="outline" onClick={imprimirPDF} className="font-semibold">
            <Printer className="h-4 w-4 mr-2 text-rose-600" />PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4"><div className="text-[11px] text-muted-foreground uppercase font-semibold">Ventas</div><div className="text-2xl font-extrabold text-primary mt-1">{formatPEN(stats.total)}</div></Card>
        <Card className="p-4"><div className="text-[11px] text-muted-foreground uppercase font-semibold">Transacciones</div><div className="text-2xl font-extrabold mt-1">{stats.count}</div></Card>
        <Card className="p-4"><div className="text-[11px] text-muted-foreground uppercase font-semibold">Ticket promedio</div><div className="text-2xl font-extrabold mt-1">{formatPEN(stats.promedio)}</div></Card>
        <Card className="p-4"><div className="text-[11px] text-muted-foreground uppercase font-semibold">Gastos</div><div className="text-2xl font-extrabold text-red-600 mt-1">{formatPEN(gastosTotal)}</div></Card>
        <Card className="p-4 col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-50 to-card border-emerald-200">
          <div className="text-[11px] text-emerald-700 uppercase font-semibold">Utilidad bruta</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{formatPEN(stats.total - gastosTotal)}</div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Evolución de ventas</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.serie}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
              <Tooltip formatter={(v: number) => formatPEN(v)} contentStyle={{ borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Ventas (S/)" />
              <Line type="monotone" dataKey="trans" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Transacciones" yAxisId="right" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-bold mb-3">Distribución por método de pago</div>
          {stats.metodos.length === 0 ? <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div> : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.metodos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${formatPEN(e.value)}`}>
                    {stats.metodos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatPEN(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="font-bold mb-3">Por tipo de comprobante</div>
          {stats.tipos.length === 0 ? <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={stats.tipos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v: number) => formatPEN(v)} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {stats.tipos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
