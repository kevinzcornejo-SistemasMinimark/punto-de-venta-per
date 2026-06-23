import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tags, Printer, Plus, X } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatPEN } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/etiquetas")({
  head: () => ({ meta: [{ title: "Etiquetas — POS Minimarket" }] }),
  component: EtiquetasPage,
});

function EtiquetasPage() {
  const { productos } = useCatalog();
  const [cola, setCola] = useState<{ id: string; cantidad: number }[]>([]);
  const [q, setQ] = useState("");

  const add = (id: string) => setCola((c) => c.find((x) => x.id === id) ? c.map((x) => x.id === id ? { ...x, cantidad: x.cantidad + 1 } : x) : [...c, { id, cantidad: 1 }]);
  const setCantidad = (id: string, n: number) => setCola((c) => c.map((x) => x.id === id ? { ...x, cantidad: Math.max(1, n) } : x));
  const remove = (id: string) => setCola((c) => c.filter((x) => x.id !== id));

  const items = cola.map((c) => ({ ...c, prod: productos.find((p) => p.id === c.id)! })).filter((x) => x.prod);
  const totalEtiquetas = items.reduce((s, x) => s + x.cantidad, 0);
  const filtrados = q.trim() ? productos.filter((p) => p.nombre.toLowerCase().includes(q.toLowerCase())) : productos.slice(0, 30);

  const imprimir = () => { window.print(); toast.success("Etiquetas enviadas a impresión"); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Tags className="h-6 w-6 text-primary" /> Etiquetas de productos</h1>
          <p className="text-muted-foreground">Genera e imprime etiquetas con código de barras</p>
        </div>
        <Button onClick={imprimir} disabled={items.length === 0}><Printer className="h-4 w-4 mr-1" />Imprimir {totalEtiquetas}</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 print:hidden">
        <Card className="p-4">
          <div className="font-semibold mb-2">Productos</div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="mb-2" />
          <div className="max-h-96 overflow-y-auto divide-y">
            {filtrados.map((p) => (
              <button key={p.id} onClick={() => add(p.id)} className="w-full flex items-center justify-between py-2 hover:bg-muted px-2 rounded text-left">
                <div>
                  <div className="text-sm font-medium">{p.nombre}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.codigo_barras}</div>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-2">Cola de impresión ({totalEtiquetas})</div>
          {items.length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">Agrega productos</div>
          : <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((x) => (
              <div key={x.id} className="flex items-center gap-2 border rounded p-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{x.prod.nombre}</div>
                  <div className="text-xs text-muted-foreground">{formatPEN(x.prod.precio_venta)}</div>
                </div>
                <Input type="number" value={x.cantidad} onChange={(e) => setCantidad(x.id, parseInt(e.target.value) || 1)} className="w-20 h-8" />
                <Button size="icon" variant="ghost" onClick={() => remove(x.id)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>}
        </Card>
      </div>

      <div className="hidden print:grid grid-cols-3 gap-2">
        {items.flatMap((x) => Array.from({ length: x.cantidad }).map((_, i) => (
          <div key={`${x.id}-${i}`} className="border p-2 text-center break-inside-avoid">
            <div className="text-xs font-semibold truncate">{x.prod.nombre}</div>
            <div className="font-bold text-lg">{formatPEN(x.prod.precio_venta)}</div>
            <div className="text-[10px] font-mono">{x.prod.codigo_barras}</div>
          </div>
        )))}
      </div>
    </div>
  );
}