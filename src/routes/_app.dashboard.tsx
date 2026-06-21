import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { formatPEN } from "@/lib/format";
import { TrendingUp, ShoppingBag, AlertTriangle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/hooks/useCatalog";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — POS Minimarket" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { isDemo, user } = useAuth();
  const { productos } = useCatalog();
  const [ventasHoy, setVentasHoy] = useState(1284.5);
  const [transacciones, setTransacciones] = useState(37);

  useEffect(() => {
    if (isDemo || !user) return;
    (async () => {
      const desde = new Date();
      desde.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("ventas")
        .select("total,estado,creada_en")
        .gte("creada_en", desde.toISOString())
        .neq("estado", "ANULADA");
      const rows = data ?? [];
      setVentasHoy(rows.reduce((s, v: any) => s + Number(v.total ?? 0), 0));
      setTransacciones(rows.length);
    })();
  }, [isDemo, user?.id]);

  const ticketPromedio = transacciones ? ventasHoy / transacciones : 0;
  const stockCritico = productos.filter((p) => p.stock <= p.stock_minimo);

  const kpis = [
    { label: "Ventas de hoy", value: formatPEN(ventasHoy), icon: TrendingUp, color: "text-emerald-500" },
    { label: "Transacciones", value: String(transacciones), icon: ShoppingBag, color: "text-sky-500" },
    { label: "Ticket promedio", value: formatPEN(ticketPromedio), icon: Wallet, color: "text-violet-500" },
    { label: "Stock crítico", value: String(stockCritico.length), icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu minimarket</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <div className="text-2xl font-extrabold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold mb-3">Top productos</h2>
          <div className="space-y-2">
            {productos.slice(0, 6).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  {p.nombre}
                </span>
                <span className="font-semibold">{formatPEN(p.precio_venta)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold mb-3">Stock crítico</h2>
          {stockCritico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todo OK ✅</p>
          ) : (
            <div className="space-y-2">
              {stockCritico.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <span>{p.nombre}</span>
                  <span className="font-semibold text-destructive">
                    {p.stock} {p.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}