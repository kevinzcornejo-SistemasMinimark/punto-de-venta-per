import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Boxes, Search, AlertTriangle } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/inventario")({
  head: () => ({ meta: [{ title: "Inventario — POS Minimarket" }] }),
  component: InventarioPage,
});

function InventarioPage() {
  const { productos, loading } = useCatalog();
  const [q, setQ] = useState("");
  const [solo, setSolo] = useState<"todos" | "bajo" | "agotado">("todos");

  const filtered = useMemo(() => {
    let list = productos;
    if (q.trim()) {
      const k = q.toLowerCase();
      list = list.filter(
        (p) => p.nombre.toLowerCase().includes(k) || p.codigo_barras.includes(k),
      );
    }
    if (solo === "bajo") list = list.filter((p) => p.stock > 0 && p.stock <= p.stock_minimo);
    if (solo === "agotado") list = list.filter((p) => p.stock <= 0);
    return list;
  }, [productos, q, solo]);

  const stats = useMemo(() => {
    const total = productos.length;
    const bajo = productos.filter((p) => p.stock > 0 && p.stock <= p.stock_minimo).length;
    const agotado = productos.filter((p) => p.stock <= 0).length;
    const valor = productos.reduce((s, p) => s + p.stock * p.precio_compra, 0);
    return { total, bajo, agotado, valor };
  }, [productos]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" /> Inventario
          </h1>
          <p className="text-muted-foreground">Stock actual de productos y alertas</p>
        </div>
        <Link to="/kardex" className="text-sm text-primary hover:underline">Ver Kardex →</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Productos</div><div className="text-2xl font-bold">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Stock bajo</div><div className="text-2xl font-bold text-amber-600">{stats.bajo}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Agotados</div><div className="text-2xl font-bold text-destructive">{stats.agotado}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Valor inventario</div><div className="text-2xl font-bold">{formatPEN(stats.valor)}</div></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto o código…" className="pl-9" />
        </div>
        {(["todos","bajo","agotado"] as const).map((k) => (
          <button key={k} onClick={() => setSolo(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${solo===k?"bg-primary text-primary-foreground border-primary":"bg-card hover:bg-muted"}`}>
            {k === "todos" ? "Todos" : k === "bajo" ? "Stock bajo" : "Agotados"}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2 text-right">Mínimo</th>
              <th className="px-4 py-2 text-right">P. compra</th>
              <th className="px-4 py-2 text-right">P. venta</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin productos</td></tr>
            ) : filtered.map((p) => {
              const agot = p.stock <= 0;
              const bajo = !agot && p.stock <= p.stock_minimo;
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.codigo_barras || "—"}</td>
                  <td className="px-4 py-2 text-right font-semibold">{p.stock} {p.unidad}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{p.stock_minimo}</td>
                  <td className="px-4 py-2 text-right">{formatPEN(p.precio_compra)}</td>
                  <td className="px-4 py-2 text-right">{formatPEN(p.precio_venta)}</td>
                  <td className="px-4 py-2">
                    {agot ? <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Agotado</Badge>
                      : bajo ? <Badge className="bg-amber-500 hover:bg-amber-600">Bajo</Badge>
                      : <Badge variant="secondary">OK</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}